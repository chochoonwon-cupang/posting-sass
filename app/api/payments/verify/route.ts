import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

/**
 * POST /api/payments/verify
 * Body: { imp_uid: string, merchant_uid: string }
 *
 * 1. imp_uid로 포트원 REST API 결제 검증
 * 2. merchant_uid에서 subscription_id 파싱 → DB monthly_amount와 금액 일치 확인
 * 3. 맞으면 activate_subscription 후 apply_subscription_payment RPC 호출
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
    const imp_uid = body?.imp_uid as string | undefined;
    const merchant_uid = body?.merchant_uid as string | undefined;

    if (!imp_uid) {
      return NextResponse.json(
        { error: "imp_uid required" },
        { status: 400 }
      );
    }

    if (!merchant_uid) {
      return NextResponse.json(
        { error: "merchant_uid required" },
        { status: 400 }
      );
    }

    const apiSecret = process.env.PORTONE_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json(
        { error: "결제 검증 설정이 완료되지 않았습니다. (PORTONE_API_SECRET)" },
        { status: 500 }
      );
    }

    // 1. 포트원 REST API로 결제 검증
    const paymentRes = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(imp_uid)}`,
      {
        headers: {
          Authorization: `PortOne ${apiSecret}`,
        },
      }
    );

    if (!paymentRes.ok) {
      const errData = await paymentRes.json().catch(() => ({}));
      console.error("[payments/verify] PortOne API error:", errData);
      return NextResponse.json(
        { error: "결제 정보 조회에 실패했습니다." },
        { status: 400 }
      );
    }

    const payment = await paymentRes.json();
    const serverAmount = payment?.amount?.total ?? payment?.amount;

    const status = payment?.status;
    const successStatuses = ["PAID", "VIRTUAL_ACCOUNT_ISSUED"];
    if (!successStatuses.includes(status)) {
      return NextResponse.json(
        { error: `결제가 완료되지 않았습니다. (status: ${status})` },
        { status: 400 }
      );
    }

    // 2. merchant_uid 파싱: sub_{subscription_id}_{timestamp}
    const parts = merchant_uid.split("_");
    const subscriptionId = parts[1];
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "잘못된 merchant_uid 형식입니다." },
        { status: 400 }
      );
    }

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("id, user_id, monthly_amount, status")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (subError || !sub) {
      return NextResponse.json(
        { error: "구독 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 3. 결제 금액이 DB monthly_amount와 동일한지 확인
    const monthlyAmount = sub.monthly_amount ?? 0;
    const paidAmount = Number(serverAmount);
    if (monthlyAmount <= 0 || paidAmount !== monthlyAmount) {
      return NextResponse.json(
        { error: `결제 금액이 일치하지 않습니다. (예상: ${monthlyAmount}원)` },
        { status: 400 }
      );
    }

    // 4. draft → active 전환 (첫 결제 시)
    if (sub.status === "draft") {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { error: activateError } = await supabase.rpc("activate_subscription", {
        p_subscription_id: sub.id,
        p_provider: "portone",
        p_provider_customer_id: user.id,
        p_provider_subscription_id: imp_uid,
        p_next_billing_at: nextMonth.toISOString(),
      });

      if (activateError) {
        console.error("[payments/verify] activate_subscription:", activateError);
        return NextResponse.json(
          { error: "구독 활성화에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    // 5. apply_subscription_payment RPC 호출 (service_role)
    const admin = createAdminClient();
    const { data: rpcResult, error: rpcError } = await admin.rpc(
      "apply_subscription_payment",
      {
        p_provider: "portone",
        p_provider_event_id: imp_uid,
        p_user_id: user.id,
        p_amount: Math.floor(paidAmount),
      }
    );

    if (rpcError) {
      console.error("[payments/verify] apply_subscription_payment:", rpcError);
      return NextResponse.json(
        { error: rpcError.message },
        { status: 500 }
      );
    }

    const result = rpcResult as { success?: boolean; duplicate?: boolean; error?: string };
    if (result?.success === false && result?.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      imp_uid,
      merchant_uid,
      amount: paidAmount,
      duplicate: result?.duplicate ?? false,
      ...result,
    });
  } catch (err) {
    console.error("[payments/verify]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
