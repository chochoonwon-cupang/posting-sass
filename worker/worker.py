#!/usr/bin/env python3
"""
VPS 워커: dequeue_bid RPC로 입찰 건을 가져와 더미 실행 후 finish_bid/fail_bid 호출
RPC 파라미터: finish_bid(p_bid_id uuid, p_published_url text), fail_bid(p_bid_id uuid, p_reason text)
"""

import logging
import os
import random
import socket
import time
from datetime import datetime

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
WORKER_ID = os.environ.get("WORKER_ID") or f"{socket.gethostname()}-{os.getpid()}"
REQUEUE_INTERVAL_SEC = int(os.environ.get("REQUEUE_INTERVAL_SEC", "60"))
IDLE_SLEEP_SEC = float(os.environ.get("IDLE_SLEEP_SEC", "2"))


def main():
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("ERROR: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수를 설정하세요.")
        return 1

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    print(f"Worker started. WORKER_ID={WORKER_ID} REQUEUE_INTERVAL={REQUEUE_INTERVAL_SEC}s IDLE_SLEEP={IDLE_SLEEP_SEC}s")
    print("-" * 60)

    last_requeue = 0.0

    while True:
        # 1) 주기적으로 stuck 복구 (60초마다)
        now = time.time()
        if now - last_requeue >= REQUEUE_INTERVAL_SEC:
            try:
                res = supabase.rpc("requeue_stuck_bids", {}).execute()
                count = res.data
                if isinstance(count, int):
                    print(f"[{_ts()}] requeued: {count}")
                else:
                    print(f"[{_ts()}] requeue ok: {res.data}")
            except Exception as e:
                logging.exception("[requeue] error")
                print(f"[{_ts()}] requeue error: {e!r}")
            last_requeue = now

        # 2) 다음 작업 가져오기
        try:
            result = _dequeue_bid(supabase)
        except Exception as e:
            print(f"[{_ts()}] dequeue error: {e!r}")
            time.sleep(IDLE_SLEEP_SEC)
            continue

        if not result.data or len(result.data) == 0:
            time.sleep(IDLE_SLEEP_SEC)
            continue

        # 3) 기존 bid 처리 로직
        _process_bid(supabase, result.data[0])


def _dequeue_bid(supabase):
    """dequeue_bid 호출. p_worker_id, p_lease_seconds 전달."""
    return supabase.rpc(
        "dequeue_bid",
        {"p_worker_id": WORKER_ID, "p_lease_seconds": 60},
    ).execute()


def _process_bid(supabase, bid):
    """기존 bid 처리: 더미 실행 후 finish_bid/fail_bid 호출"""
    bid_id = None
    bid_price = "?"
    keyword = "?"
    try:
        bid_id = bid.get("id")
        bid_price = bid.get("bid_price", bid.get("bid_amount", "?"))
        keyword = bid.get("keyword", "?")
        status = bid.get("status", "in_progress")

        print(f"[{_ts()}] Dequeued bid id={bid_id} bid_price={bid_price} keyword={keyword} status={status}")

        # 더미 실행: 10~20초 랜덤 sleep
        sleep_sec = random.uniform(10, 20)
        print(f"[{_ts()}] Processing (sleep {sleep_sec:.1f}s)...")
        time.sleep(sleep_sec)

        # 80% 성공, 20% 실패
        success = random.random() < 0.8

        if success:
            try:
                published_url = f"https://example.com/post/{bid_id}"
                print(f"[{_ts()}] finish_bid bid_id={bid_id} published_url={published_url}")
                rpc_result = supabase.rpc(
                    "finish_bid",
                    {"p_bid_id": str(bid_id), "p_published_url": published_url},
                ).execute()
                rpc_error = getattr(rpc_result, "error", None) or getattr(rpc_result, "error_message", None)
                print(f"[{_ts()}] finish_bid response: data={rpc_result.data} error={rpc_error}")
                if rpc_error:
                    print(f"[{_ts()}] fail_bid bid_id={bid_id} reason={rpc_error!s}")
                    _call_fail_bid(supabase, bid_id, str(rpc_error)[:200], bid_price, keyword)
                else:
                    print(f"[{_ts()}] SUCCESS bid_id={bid_id} bid_price={bid_price} keyword={keyword} status=done")
            except Exception as rpc_err:
                print(f"[{_ts()}] ERROR: finish_bid RPC failed - {rpc_err}")
                print(f"[{_ts()}] fail_bid bid_id={bid_id} reason={rpc_err!s}")
                _call_fail_bid(supabase, bid_id, str(rpc_err)[:200], bid_price, keyword)
        else:
            try:
                reason = "dummy_fail"
                print(f"[{_ts()}] fail_bid bid_id={bid_id} reason={reason}")
                rpc_result = supabase.rpc(
                    "fail_bid",
                    {"p_bid_id": str(bid_id), "p_reason": reason},
                ).execute()
                rpc_error = getattr(rpc_result, "error", None) or getattr(rpc_result, "error_message", None)
                print(f"[{_ts()}] fail_bid response: data={rpc_result.data} error={rpc_error}")
                print(f"[{_ts()}] FAIL bid_id={bid_id} bid_price={bid_price} keyword={keyword} status=fail reason={reason}")
            except Exception as rpc_err:
                print(f"[{_ts()}] ERROR: fail_bid RPC failed - {rpc_err}")

        print("-" * 60)

    except Exception as e:
        print(f"[{_ts()}] ERROR: {e}")
        if bid_id:
            print(f"[{_ts()}] fail_bid bid_id={bid_id} reason={e!s}")
            _call_fail_bid(supabase, bid_id, str(e)[:200], bid_price, keyword)
        print("-" * 60)


def _call_fail_bid(supabase, bid_id, reason, bid_price, keyword):
    """fail_bid RPC 호출 (p_bid_id, p_reason 파라미터명 고정)"""
    try:
        supabase.rpc("fail_bid", {"p_bid_id": str(bid_id), "p_reason": reason}).execute()
        print(f"[{_ts()}] FAIL bid_id={bid_id} bid_price={bid_price} keyword={keyword} status=fail reason={reason}")
    except Exception as rpc_err:
        print(f"[{_ts()}] ERROR: fail_bid RPC failed - {rpc_err}")


def _ts() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


if __name__ == "__main__":
    exit(main() or 0)
