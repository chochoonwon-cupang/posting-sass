-- Worker용 RPC: dequeue_bid, finish_bid, fail_bid, requeue_stuck_bids
-- Supabase SQL Editor에서 실행하세요.
-- bids.status: queued -> processing(dequeue) -> done(finish) / failed(fail_bid)
-- bids 컬럼: lease_until, leased_by, started_at (stuck 복구용)

-- dequeue_bid(p_worker_id, p_lease_seconds): queued 1건을 processing으로 변경 후 반환
CREATE OR REPLACE FUNCTION public.dequeue_bid(p_worker_id text DEFAULT NULL, p_lease_seconds int DEFAULT 60)
RETURNS SETOF public.bids
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_id uuid;
BEGIN
  UPDATE public.bids
  SET status = 'processing',
      leased_by = COALESCE(p_worker_id, ''),
      lease_until = now() + make_interval(secs => p_lease_seconds),
      started_at = now()
  WHERE id = (
    SELECT id FROM public.bids
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT * FROM public.bids WHERE id = v_id;
END;
$$;

-- finish_bid(p_bid_id, p_published_url): status='processing'인 bid만 done으로 변경
CREATE OR REPLACE FUNCTION public.finish_bid(p_bid_id uuid, p_published_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_updated int;
BEGIN
  UPDATE public.bids
  SET status = 'done', publish_url = p_published_url
  WHERE id = p_bid_id AND status = 'processing';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'bid not found or not processing: %', p_bid_id;
  END IF;
END;
$$;

-- fail_bid(p_bid_id, p_reason): status='processing'인 bid만 failed로 변경
CREATE OR REPLACE FUNCTION public.fail_bid(p_bid_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_updated int;
BEGIN
  UPDATE public.bids
  SET status = 'failed'
  WHERE id = p_bid_id AND status = 'processing';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'bid not found or not processing: %', p_bid_id;
  END IF;
END;
$$;

-- requeue_stuck_bids(): lease_until이 지난 processing bid를 queued로 되돌림
CREATE OR REPLACE FUNCTION public.requeue_stuck_bids()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_count int;
BEGIN
  WITH updated AS (
    UPDATE public.bids
    SET status = 'queued',
        leased_by = NULL,
        lease_until = NULL
    WHERE status = 'processing'
      AND lease_until IS NOT NULL
      AND lease_until < now()
    RETURNING id
  )
  SELECT count(*)::int INTO v_count FROM updated;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dequeue_bid(text, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_bid(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_bid(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.requeue_stuck_bids() TO service_role;
