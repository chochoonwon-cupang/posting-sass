"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { Card } from "@/components/ui";

const AMOUNTS = [10000, 30000, 100000];

interface ChargeClientProps {
  initialBalance: number;
}

export function ChargeClient({ initialBalance }: ChargeClientProps) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [isPaying, setIsPaying] = useState(false);
  const [portoneReady, setPortoneReady] = useState(false);

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

  async function fetchBalance(userId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("balance")
      .eq("id", userId)
      .maybeSingle();
    setBalance(data?.balance ?? 0);
  }

  function handleAmountSelect(amount: number) {
    setSelectedAmount(amount);
  }

  function handleReset() {
    setSelectedAmount(0);
  }

  async function handleChargePayment() {
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
      setIsPaying(true);

      const prepareRes = await fetch("/api/payments/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          amount: selectedAmount,
          purpose: "charge",
        }),
      });

      const prepareData = await prepareRes.json().catch(() => ({}));
      if (!prepareRes.ok) {
        const errMsg = prepareData?.error ?? prepareData?.message ?? "결제 준비에 실패했습니다.";
        alert(errMsg);
        setIsPaying(false);
        return;
      }

      const merchant_uid = prepareData.merchant_uid;

      if (!merchant_uid) {
        alert("결제 준비 응답이 올바르지 않습니다.");
        setIsPaying(false);
        return;
      }

      let buyerEmail = user.email ?? "";
      if (!buyerEmail) {
        buyerEmail = window.prompt("결제용 이메일을 입력해 주세요")?.trim() ?? "";
      }
      if (!buyerEmail) {
        alert("이메일이 없어서 결제를 진행할 수 없습니다.");
        setIsPaying(false);
        return;
      }

      let buyerPhone = "";
      try {
        const { data: u2 } = await supabase
          .from("users")
          .select("phone, phone_number, mobile, tel")
          .eq("id", user.id)
          .maybeSingle();
        buyerPhone = (u2?.phone ?? u2?.phone_number ?? u2?.mobile ?? u2?.tel ?? "") as string;
      } catch {}
      if (!buyerPhone) {
        buyerPhone =
          window.prompt("결제용 휴대폰번호를 입력해 주세요 (예: 01012345678)")?.trim() ?? "";
      }
      buyerPhone = buyerPhone.replace(/[^0-9]/g, "");
      if (buyerPhone.length < 10) {
        alert("휴대폰번호가 올바르지 않습니다. 숫자만 10~11자리로 입력해 주세요.");
        setIsPaying(false);
        return;
      }

      let buyerName = "";
      try {
        const { data: u3 } = await supabase
          .from("users")
          .select("name, full_name, username, nickname")
          .eq("id", user.id)
          .maybeSingle();
        buyerName = (u3?.name ?? u3?.full_name ?? u3?.username ?? u3?.nickname ?? "") as string;
      } catch {}
      if (!buyerName) {
        buyerName = window.prompt("결제용 이름(구매자명)을 입력해 주세요")?.trim() ?? "";
      }
      if (!buyerName) {
        alert("구매자 이름이 필요합니다.");
        setIsPaying(false);
        return;
      }

      const result = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        paymentId: merchant_uid,
        orderName: "충전",
        totalAmount: Number(selectedAmount),
        currency: "KRW",
        payMethod: "CARD",
        customer: {
          email: buyerEmail,
          phoneNumber: buyerPhone,
          fullName: buyerName,
        },
      } as any);

      const imp_uid = result?.paymentId ?? result?.id ?? result?.payment?.id;
      if (!imp_uid) {
        alert("결제 결과를 확인할 수 없습니다.");
        setIsPaying(false);
        return;
      }

      const maxRetries = 5;
      const retryIntervalMs = 1000;
      let confirmData: { ok?: boolean; reason?: string; detail?: { status?: string } } = {};

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const confirmRes = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: imp_uid, purpose: "charge" }),
        });

        confirmData = await confirmRes.json().catch(() => ({}));

        if (confirmData.ok === true) {
          break;
        }

        const reason = confirmData.reason ?? "";
        const isInProgress =
          reason.includes("결제 미완료") ||
          ["READY", "PROCESSING", "PENDING"].some((s) =>
            (confirmData.detail?.status ?? "").toUpperCase().includes(s)
          );

        if (isInProgress && attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, retryIntervalMs));
          continue;
        }

        break;
      }

      if (confirmData.ok !== true) {
        const reason = confirmData.reason ?? "";
        let msg: string;
        if (
          reason.includes("API Secret") ||
          (confirmData.detail as { httpStatus?: number })?.httpStatus === 401
        ) {
          msg =
            "결제는 완료됐을 수 있는데 서버 확인이 실패(401)해서 적립이 안 됨. API Secret 확인 필요";
        } else if (reason.includes("결제 미완료") || reason.includes("결제 진행중")) {
          msg = "결제가 아직 처리 중입니다. 잠시 후 다시 시도해 주세요.";
        } else {
          msg = reason || "결제 검증에 실패했습니다.";
        }
        alert(msg);
        setIsPaying(false);
        return;
      }

      alert("충전이 완료되었습니다.");
      setSelectedAmount(0);
      await new Promise((r) => setTimeout(r, 300));
      await fetchBalance(user.id);
    } catch (err) {
      console.error("[handleChargePayment]", err);
      alert(err instanceof Error ? err.message : "결제 중 오류가 발생했습니다.");
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm font-medium text-zinc-500">현재 잔액</p>
        <p className="mt-1 text-2xl font-bold text-zinc-900">{balance.toLocaleString()}원</p>
      </Card>

      <Card>
        <p className="text-sm font-medium text-zinc-500">충전 금액</p>
        <p className="mt-1 text-2xl font-bold text-zinc-900">
          {selectedAmount.toLocaleString()}원
        </p>
      </Card>

      <div className="flex flex-wrap gap-3">
        {AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handleAmountSelect(amount)}
            disabled={isPaying}
            className="min-w-[80px] flex-1 rounded-xl border-2 border-zinc-200 bg-white py-3 font-semibold text-zinc-900 transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
          >
            {amount.toLocaleString()}원
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleReset}
        disabled={isPaying}
        className="w-full rounded-xl border-2 border-zinc-300 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
      >
        초기화
      </button>

      <button
        type="button"
        onClick={handleChargePayment}
        disabled={isPaying || !portoneReady || selectedAmount <= 0}
        className="w-full rounded-xl bg-indigo-600 py-4 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600"
      >
        {isPaying ? "결제 준비 중..." : "결제하기"}
      </button>

      <p className="text-xs text-zinc-500">
        정기구독이 아닌 경우 보너스크레딧을 지급하지 않습니다.
      </p>
    </div>
  );
}
