"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui";

const TIERS = [
  { amount: 300000, label: "30만" },
  { amount: 500000, label: "50만" },
  { amount: 1000000, label: "100만" },
];

type Subscription = {
  id: string;
  m300_qty: number;
  m500_qty: number;
  m1000_qty: number;
  monthly_amount: number;
  status: string;
};

export default function SubscribePage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [portoneReady, setPortoneReady] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);

  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

  useEffect(() => {
    const check = () => {
      if ((window as any).PortOne) {
        setPortoneReady(true);
        return true;
      }
      return false;
    };
    if (check()) return;
    const id = setInterval(() => {
      if (check()) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, []);

  async function fetchSubscription(userId: string) {
    const supabase = createClient();
    let { data, error } = await supabase
      .from("subscriptions")
      .select("id, status, monthly_amount, m300_qty, m500_qty, m1000_qty")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!data && !error) {
      ({ data, error } = await supabase
        .from("subscriptions")
        .select("id, status, monthly_amount, m300_qty, m500_qty, m1000_qty")
        .eq("user_id", userId)
        .maybeSingle());
    }

    if (error) {
      console.error("[subscriptions select] error:", JSON.stringify(error, null, 2));
      return;
    }
    setSubscription(data ?? null);
  }

  async function ensureAndFetch() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { error: rpcError } = await supabase.rpc("ensure_draft_subscription", {
        p_user_id: user.id,
      });

      if (rpcError) {
        console.error("[ensure_draft_subscription] error:", JSON.stringify(rpcError, null, 2));
        alert(rpcError.message);
        return;
      }

      await fetchSubscription(user.id);
    } finally {
      setLoading(false);
    }
  }

  function handleAmountAdd(tierAmount: 300000 | 500000 | 1000000) {
    setSelectedAmount((prev) => prev + tierAmount);
  }

  function handleReset() {
    setSelectedAmount(0);
  }

  async function handlePayment() {
    if (!subscription) return;
    if (selectedAmount <= 0) {
      alert("금액을 선택해주세요.");
      return;
    }

    const PortOne = (window as any).PortOne;
    if (!PortOne) {
      alert("PortOne SDK가 로딩되지 않았습니다. 페이지를 새로고침 후 다시 시도해 주세요.");
      return;
    }

    if (!storeId || !channelKey) {
      alert("NEXT_PUBLIC_PORTONE_STORE_ID 또는 NEXT_PUBLIC_PORTONE_CHANNEL_KEY가 설정되지 않았습니다.");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    try {
      setFetching(true);

      // prepare API가 subscription을 찾으려면 monthly_amount > 0 필요 → 결제 직전에 cart 동기화
      const { error: resetErr } = await supabase.rpc("sub_cart_reset", {
        p_subscription_id: subscription.id,
      });
      if (resetErr) {
        console.error("[sub_cart_reset] error:", JSON.stringify(resetErr, null, 2));
        alert(resetErr.message);
        setFetching(false);
        return;
      }
      let remaining = selectedAmount;
      const add100 = Math.floor(remaining / 1_000_000);
      remaining -= add100 * 1_000_000;
      const add50 = Math.floor(remaining / 500_000);
      remaining -= add50 * 500_000;
      const add30 = Math.floor(remaining / 300_000);
      for (let i = 0; i < add100; i++) {
        const { error } = await supabase.rpc("sub_cart_add", {
          p_subscription_id: subscription.id,
          p_sku: "1000000",
          p_delta: 1,
        });
        if (error) {
          console.error("[sub_cart_add] error:", JSON.stringify(error, null, 2));
          alert(error.message);
          setFetching(false);
          return;
        }
      }
      for (let i = 0; i < add50; i++) {
        const { error } = await supabase.rpc("sub_cart_add", {
          p_subscription_id: subscription.id,
          p_sku: "500000",
          p_delta: 1,
        });
        if (error) {
          console.error("[sub_cart_add] error:", JSON.stringify(error, null, 2));
          alert(error.message);
          setFetching(false);
          return;
        }
      }
      for (let i = 0; i < add30; i++) {
        const { error } = await supabase.rpc("sub_cart_add", {
          p_subscription_id: subscription.id,
          p_sku: "300000",
          p_delta: 1,
        });
        if (error) {
          console.error("[sub_cart_add] error:", JSON.stringify(error, null, 2));
          alert(error.message);
          setFetching(false);
          return;
        }
      }

      const prepareRes = await fetch("/api/payments/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          amount: selectedAmount,
          purpose: "subscription",
        }),
      });

      const prepareData = await prepareRes.json().catch(() => ({}));
      if (!prepareRes.ok) {
        const errMsg = prepareData?.error ?? prepareData?.message ?? "결제 준비에 실패했습니다.";
        console.error("[결제] prepare 실패:", prepareRes.status, prepareData);
        alert(errMsg);
        setFetching(false);
        return;
      }

      const merchant_uid = prepareData.merchant_uid;
      const prepareAmount = prepareData.amount as number;

      if (!merchant_uid || prepareAmount == null || prepareAmount <= 0) {
        console.error("[결제] prepare 응답 오류:", prepareData);
        alert("결제 준비 응답이 올바르지 않습니다. (merchant_uid, amount 확인)");
        setFetching(false);
        return;
      }

      const paymentId = merchant_uid;

      console.log("[결제 디버그] storeId:", storeId ? `${storeId.slice(0, 12)}…` : "undefined");
      console.log("[결제 디버그] channelKey:", channelKey ? `${channelKey.slice(0, 16)}…` : "undefined");
      console.log("[결제 디버그] paymentId, amount:", paymentId, prepareAmount);

      // ✅ 구매자 이메일 확보 (이니시스 v2 필수)
      const { data: userRes } = await supabase.auth.getUser();
      let buyerEmail = userRes?.user?.email ?? "";

      if (!buyerEmail) {
        buyerEmail = window.prompt("결제용 이메일을 입력해 주세요")?.trim() ?? "";
      }
      if (!buyerEmail) {
        alert("이메일이 없어서 결제를 진행할 수 없습니다.");
        setFetching(false);
        return;
      }

      // ✅ 구매자 휴대폰번호 확보 (이니시스 v2 필수)
      let buyerPhone = "";

      // 1) users 테이블에 phone 컬럼이 있으면 거기서 먼저 가져오기 (있을 때만)
      try {
        const { data: u2 } = await supabase
          .from("users")
          .select("phone, phone_number, mobile, tel")
          .eq("id", user.id)
          .maybeSingle();

        buyerPhone =
          (u2?.phone ?? u2?.phone_number ?? u2?.mobile ?? u2?.tel ?? "") as string;
      } catch {}

      // 2) 없으면 prompt로 받기
      if (!buyerPhone) {
        buyerPhone =
          window
            .prompt("결제용 휴대폰번호를 입력해 주세요 (예: 01012345678)")
            ?.trim() ?? "";
      }

      // 3) 숫자만 남기기
      buyerPhone = buyerPhone.replace(/[^0-9]/g, "");

      // 4) 최소 검증
      if (buyerPhone.length < 10) {
        alert("휴대폰번호가 올바르지 않습니다. 숫자만 10~11자리로 입력해 주세요.");
        setFetching(false);
        return;
      }

      // ✅ 구매자 이름 확보 (이니시스 v2 필수)
      let buyerName = "";

      // 1) users 테이블에 name 컬럼류가 있으면 거기서 먼저 가져오기 (있을 때만)
      try {
        const { data: u3 } = await supabase
          .from("users")
          .select("name, full_name, username, nickname")
          .eq("id", user.id)
          .maybeSingle();

        buyerName =
          (u3?.name ?? u3?.full_name ?? u3?.username ?? u3?.nickname ?? "") as string;
      } catch {}

      // 2) 없으면 prompt로 받기
      if (!buyerName) {
        buyerName =
          window.prompt("결제용 이름(구매자명)을 입력해 주세요")?.trim() ?? "";
      }

      if (!buyerName) {
        alert("구매자 이름이 필요합니다.");
        setFetching(false);
        return;
      }

      const result = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        paymentId,
        orderName: `월 구독 ${selectedAmount.toLocaleString("ko-KR")}원`,
        totalAmount: Number(selectedAmount),
        currency: "KRW",
        payMethod: "CARD",

        // ✅ 이니시스 v2 일반결제 필수
        customer: {
          email: buyerEmail,
          phoneNumber: buyerPhone,
          fullName: buyerName,
        },
      } as any);

      const imp_uid = result?.paymentId ?? result?.id ?? result?.payment?.id;
      if (!imp_uid) {
        console.error("[결제] PortOne 응답:", result);
        alert("결제 결과를 확인할 수 없습니다.");
        setFetching(false);
        return;
      }

      const confirmRes = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: imp_uid, purpose: "subscription" }),
      });

      const confirmData = await confirmRes.json().catch(() => ({}));
      console.log("[정기구독] confirm response", confirmRes.status, confirmData);
      if (confirmData.ok !== true) {
        const reason = confirmData.reason ?? "결제 검증에 실패했습니다.";
        const is401 = confirmRes.status === 401 || (reason && String(reason).includes("API Secret"));
        alert(
          is401
            ? "결제는 완료됐을 수 있는데 서버 확인이 실패(401)해서 적립이 안 됨. API Secret 확인 필요"
            : reason
        );
        setFetching(false);
        return;
      }

      alert("결제가 완료되었습니다.");
      await new Promise((r) => setTimeout(r, 500));
      await fetchSubscription(user.id);
    } catch (err) {
      console.error("[handlePayment]", err);
      alert(err instanceof Error ? err.message : "결제 중 오류가 발생했습니다.");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    ensureAndFetch();
  }, []);

  if (loading) {
    return (
      <MobileShell title="정기구독">
        <div className="flex min-h-40 items-center justify-center">
          <p className="text-zinc-500">로딩 중...</p>
        </div>
      </MobileShell>
    );
  }

  const currentMonthlyAmount = subscription?.monthly_amount ?? 0;

  function formatKRW(n: number) {
    return n.toLocaleString("ko-KR") + "원";
  }

  function getBonusRate(amt: number) {
    if (amt >= 3_000_000) return 0.30;
    if (amt >= 1_000_000) return 0.20;
    if (amt >= 300_000) return 0.10;
    return 0;
  }

  const bonusRate = getBonusRate(selectedAmount);
  const bonusAmount = Math.floor(selectedAmount * bonusRate);
  const totalCredit = selectedAmount + bonusAmount;

  let subscriptionStatusText: string;
  if (!subscription) {
    subscriptionStatusText = "정기구독이 없습니다.";
  } else if (subscription.status === "active" && currentMonthlyAmount > 0) {
    subscriptionStatusText = `현재 ${formatKRW(currentMonthlyAmount)} 정기구독중 입니다.`;
  } else {
    subscriptionStatusText = "정기구독이 비활성 상태입니다.";
  }

  return (
    <MobileShell title="정기구독">
      <div className="space-y-6">
        <Card>
          <p className="text-sm font-medium text-zinc-500">구독 상태</p>
          <p className="mt-1 text-base font-medium text-zinc-900">
            {subscriptionStatusText}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-zinc-500">결제금액</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {formatKRW(selectedAmount)}
          </p>
        </Card>

        <div className="bg-white rounded-xl border p-4 flex items-center justify-between gap-3">
          <div className="min-w-[110px] h-[56px] rounded-lg bg-gray-50 border flex flex-col justify-center items-center">
            <div className="text-xs text-gray-500">보너스율</div>
            <div className="text-blue-600 font-bold text-lg">
              {(bonusRate * 100)}%
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">보너스금액</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatKRW(bonusAmount)}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-gray-500">총충전금액</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatKRW(totalCredit)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {TIERS.map(({ amount: tierAmount, label }) => (
            <button
              key={tierAmount}
              type="button"
              onClick={() => handleAmountAdd(tierAmount as 300000 | 500000 | 1000000)}
              disabled={fetching}
              className="flex-1 min-w-[80px] rounded-xl border-2 border-zinc-200 bg-white py-3 font-semibold text-zinc-900 transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={fetching}
          className="w-full rounded-xl border-2 border-zinc-300 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
        >
          초기화
        </button>

        <button
          type="button"
          onClick={handlePayment}
          disabled={fetching || !portoneReady || selectedAmount <= 0}
          className="w-full rounded-xl bg-indigo-600 py-4 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600"
        >
          {fetching ? "결제 준비 중..." : "결제하기"}
        </button>

        {storeId && channelKey && (
          <p className="text-xs text-zinc-400">
            [디버그] storeId: {storeId.slice(0, 12)}… / PortOne ready: {portoneReady ? "Y" : "N"}
          </p>
        )}
        {(!storeId || !channelKey) && (
          <p className="text-xs text-amber-600">
            [디버그] NEXT_PUBLIC_PORTONE_STORE_ID 또는 NEXT_PUBLIC_PORTONE_CHANNEL_KEY 미설정
          </p>
        )}
      </div>
    </MobileShell>
  );
}
