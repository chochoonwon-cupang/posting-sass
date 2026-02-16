import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

/**
 * POST /api/subscribe/start
 * Body: { subscription_id: string }
 *
 * 1. subscriptions에서 monthly_amount, bonus_rate 조회
 * 2. monthly_amount로 결제사 구독 생성 (카드 자동결제)
 * 3. activate_subscription(subscription_id, provider, customer_id, provider_subscription_id, next_billing_at) 호출
 *
 * TODO: 결제사별로 createSubscriptionWithProvider() 구현 교체
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const subscriptionId = body?.subscription_id as string | undefined;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscription_id required" },
        { status: 400 }
      );
    }

    const { data: sub, error: fetchError } = await supabase
      .from("subscriptions")
      .select("id, monthly_amount, bonus_rate")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !sub) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const monthlyAmount = sub.monthly_amount ?? 0;
    if (monthlyAmount <= 0) {
      return NextResponse.json(
        { error: "장바구니에 상품을 추가해 주세요" },
        { status: 400 }
      );
    }

    // 결제사 구독 생성 API 호출 (토스/아임포트/스트라이프 등으로 교체)
    const { providerSubscriptionId, providerCustomerId, nextBillingAt } =
      await createSubscriptionWithProvider({
        userId: user.id,
        userEmail: user.email ?? undefined,
        monthlyAmount,
        bonusRate: sub.bonus_rate ?? 10,
      });

    const { error: activateError } = await supabase.rpc("activate_subscription", {
      p_subscription_id: subscriptionId,
      p_provider: "placeholder",
      p_provider_customer_id: providerCustomerId,
      p_provider_subscription_id: providerSubscriptionId,
      p_next_billing_at: nextBillingAt,
    });

    if (activateError) {
      console.error("[subscribe/start] activate_subscription:", activateError);
      return NextResponse.json(
        { error: "Failed to activate subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "active",
      provider_subscription_id: providerSubscriptionId,
      provider_customer_id: providerCustomerId,
    });
  } catch (err) {
    console.error("[subscribe/start]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * 결제사 구독 생성 (플레이스홀더)
 * 토스/아임포트/스트라이프 등으로 교체하세요.
 * 반환: provider_subscription_id, customer_id, next_billing_at
 */
async function createSubscriptionWithProvider(params: {
  userId: string;
  userEmail?: string;
  monthlyAmount: number;
  bonusRate: number;
}): Promise<{
  providerSubscriptionId: string;
  providerCustomerId: string;
  nextBillingAt: string | null;
}> {
  // TODO: 실제 결제사 API 호출
  // 예: Stripe - stripe.subscriptions.create({ customer, items: [{ price: ... }] })
  // 예: 토스페이먼츠 - 결제창/빌링키 발급 후 정기결제 등록
  // 예: 아임포트 - IMP.request_pay 또는 정기결제 API

  // 플레이스홀더: 결제사 연동 전 테스트용
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return {
    providerSubscriptionId: `sub_placeholder_${params.userId.slice(0, 8)}_${Date.now()}`,
    providerCustomerId: `cus_placeholder_${params.userId.slice(0, 8)}`,
    nextBillingAt: nextMonth.toISOString(),
  };
}
