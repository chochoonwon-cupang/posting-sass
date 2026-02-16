import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { randomUUID } from "crypto";

/**
 * POST /api/payments/prepare
 * Body: { user_id: string, amount: number, purpose: 'subscription' | 'charge' }
 *
 * 결제창 띄우기 전에 주문번호/금액을 서버가 먼저 확정
 * - merchant_uid: order_${Date.now()}_${rand}
 * - payment_events에 status='ready' INSERT (provider='portone')
 * Returns: { merchant_uid, amount }
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
    const userId = body?.user_id as string | undefined;
    const amount = typeof body?.amount === "number" ? body.amount : undefined;
    const purpose = body?.purpose as "subscription" | "charge" | undefined;

    if (!userId || userId !== user.id) {
      return NextResponse.json(
        { error: "user_id required and must match authenticated user" },
        { status: 400 }
      );
    }

    if (amount == null || amount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    if (!purpose || !["subscription", "charge"].includes(purpose)) {
      return NextResponse.json(
        { error: "purpose must be 'subscription' or 'charge'" },
        { status: 400 }
      );
    }

    const merchant_uid = `order_${Date.now()}_${randomUUID().slice(0, 8)}`;

    const insertPayload: Record<string, unknown> = {
      provider: "portone",
      provider_event_id: merchant_uid,
      provider_payment_id: merchant_uid,
      amount: Math.floor(amount),
      status: "ready",
      user_id: userId,
      purpose,
      event_type: purpose === "charge" ? "charge.prepare" : "payment.prepare",
    };

    if (purpose === "subscription") {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .gt("monthly_amount", 0)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub) {
        insertPayload.subscription_id = sub.id;
      }
    }

    const { error: insertError } = await supabase
      .from("payment_events")
      .insert(insertPayload);

    if (insertError) {
      console.error("[payments/prepare] payment_events insert:", insertError);
      return NextResponse.json(
        { error: "결제 준비 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      merchant_uid,
      amount: Math.floor(amount),
    });
  } catch (err) {
    console.error("[payments/prepare]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
