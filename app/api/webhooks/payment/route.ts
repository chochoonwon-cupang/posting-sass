import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

/**
 * POST /api/webhooks/payment
 *
 * 결제사 payment_succeeded 웹훅 수신
 * Body: provider, provider_event_id(고유), provider_subscription_id, amount
 *
 * 1. provider_event_id, provider_subscription_id, amount 확보
 * 2. subscriptions에서 provider_subscription_id로 user_id 조회
 * 3. apply_subscription_payment(provider, provider_event_id, user_id, amount) 호출
 *
 * 중복 이벤트는 payment_events (provider, provider_event_id) 유니크로 자동 무시
 * TODO: 결제사별 웹훅 서명 검증 추가 (Stripe-Signature, 토스 시그니처 등)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const provider = body?.provider as string | undefined;
    const providerEventId = body?.provider_event_id as string | undefined;
    const providerSubscriptionId = body?.provider_subscription_id as
      | string
      | undefined;
    const amount = typeof body?.amount === "number" ? body.amount : undefined;

    if (!provider || !providerEventId || !providerSubscriptionId || amount == null) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: [
            "provider",
            "provider_event_id",
            "provider_subscription_id",
            "amount",
          ],
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("provider_subscription_id", providerSubscriptionId)
      .maybeSingle();

    const userId = sub?.user_id;

    if (!userId) {
      return NextResponse.json(
        { error: "subscription not found for provider_subscription_id" },
        { status: 404 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "amount must be positive" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("apply_subscription_payment", {
      p_provider: provider,
      p_provider_event_id: providerEventId,
      p_user_id: userId,
      p_amount: Math.floor(amount),
    });

    if (error) {
      console.error("[webhooks/payment] RPC error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const result = data as { success?: boolean; duplicate?: boolean; error?: string };
    if (result?.success === false && result?.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      duplicate: result?.duplicate ?? false,
      ...result,
    });
  } catch (err) {
    console.error("[webhooks/payment]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
