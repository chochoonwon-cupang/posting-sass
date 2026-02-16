import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

const SUCCESS_STATUSES = ["PAID", "DONE", "SUCCESS", "paid"];
const IN_PROGRESS_STATUSES = ["READY", "PROCESSING", "PENDING"];
const FAILED_STATUSES = ["FAILED", "CANCELED", "CANCELLED", "REJECTED"];

/**
 * POST /api/charge/confirm
 * Body: { merchant_uid: string, imp_uid: string }
 *
 * PortOne V2 결제 조회 후 충전 처리
 * 응답: { ok, status, reason?, raw?, amount?, paymentId? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    console.log("[charge/confirm] body", body);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        ok: false,
        status: null,
        reason: "Unauthorized",
        raw: null,
      });
    }

    const merchant_uid = body?.merchant_uid as string | undefined;
    const imp_uid = body?.imp_uid as string | undefined;

    if (!merchant_uid || !imp_uid) {
      return NextResponse.json({
        ok: false,
        status: null,
        reason: "merchant_uid와 imp_uid 모두 필요합니다.",
        raw: null,
      });
    }

    const portoneSecret = process.env.PORTONE_API_SECRET;
    if (!portoneSecret) {
      console.error("[charge/confirm] PORTONE_API_SECRET 미설정");
      return NextResponse.json({
        ok: false,
        status: null,
        reason: "결제 검증 설정이 완료되지 않았습니다.",
        raw: null,
      });
    }

    const paymentRes = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(imp_uid)}`,
      { headers: { Authorization: `PortOne ${portoneSecret}` } }
    );

    const portoneJson = await paymentRes.json().catch(() => ({}));
    console.log("[charge/confirm] portone response status", paymentRes.status);
    console.log("[charge/confirm] portone json", JSON.stringify(portoneJson, null, 2));

    const raw = portoneJson as Record<string, unknown>;
    const payment = (raw?.payment ?? raw?.data ?? raw) as {
      amount?: { total?: number } | number;
      status?: string;
    };
    const amt = payment?.amount && typeof payment.amount === "object"
      ? payment.amount.total
      : payment?.amount;
    const paidAmount = Number(amt ?? 0);
    const status = (payment?.status ?? "").toString();
    const statusUpper = status.toUpperCase();

    if (paymentRes.status >= 400 || (Object.keys(portoneJson as object).length === 0 && !status)) {
      return NextResponse.json({
        ok: false,
        status: status || null,
        reason: paymentRes.status >= 400 ? `PortOne 조회 실패 (HTTP ${paymentRes.status})` : "PortOne 결제 조회 실패",
        raw: portoneJson,
      });
    }

    if (IN_PROGRESS_STATUSES.some((s) => statusUpper.includes(s))) {
      return NextResponse.json({
        ok: false,
        status,
        reason: "결제 진행중",
        raw: portoneJson,
      });
    }

    if (FAILED_STATUSES.some((s) => statusUpper.includes(s))) {
      return NextResponse.json({
        ok: false,
        status,
        reason: `결제 실패 (status: ${status})`,
        raw: portoneJson,
      });
    }

    const isSuccess = SUCCESS_STATUSES.some((s) => statusUpper.includes(s.toUpperCase()));
    if (!isSuccess) {
      return NextResponse.json({
        ok: false,
        status,
        reason: `결제 상태 확인 필요 (status: ${status})`,
        raw: portoneJson,
      });
    }

    const { data: readyEvent } = await supabase
      .from("payment_events")
      .select("id, user_id, amount, purpose")
      .eq("provider", "portone")
      .eq("provider_event_id", merchant_uid)
      .eq("status", "ready")
      .maybeSingle();

    if (!readyEvent) {
      return NextResponse.json({
        ok: false,
        status,
        reason: "결제 준비 정보를 찾을 수 없습니다.",
        raw: portoneJson,
      });
    }

    const expectedAmount = readyEvent.amount ?? 0;
    const amountMatch = expectedAmount > 0 && paidAmount === expectedAmount;

    if (!amountMatch) {
      await supabase
        .from("payment_events")
        .update({ status: "failed", event_type: "payment.failed" })
        .eq("provider", "portone")
        .eq("provider_event_id", merchant_uid);
      return NextResponse.json({
        ok: false,
        status,
        reason: `결제 금액 불일치 (예상: ${expectedAmount}원, 실제: ${paidAmount}원)`,
        raw: portoneJson,
      });
    }

    if (readyEvent.user_id !== user.id) {
      return NextResponse.json({
        ok: false,
        status,
        reason: "결제 정보가 일치하지 않습니다.",
        raw: portoneJson,
      });
    }

    await supabase
      .from("payment_events")
      .update({
        status: "paid",
        provider_payment_id: imp_uid,
        raw: portoneJson,
        event_type: "payment.succeeded",
      })
      .eq("provider", "portone")
      .eq("provider_event_id", merchant_uid);

    const admin = createAdminClient();
    const { data: rpcResult, error: rpcError } = await admin.rpc("apply_charge_payment", {
      p_provider: "portone",
      p_provider_event_id: imp_uid,
      p_user_id: user.id,
      p_amount: Math.floor(paidAmount),
    });

    if (rpcError) {
      console.error("[charge/confirm] apply_charge_payment:", rpcError);
      return NextResponse.json({
        ok: false,
        status,
        reason: rpcError.message,
        raw: portoneJson,
      });
    }

    const result = rpcResult as { success?: boolean; duplicate?: boolean; error?: string };
    if (result?.success === false && result?.error) {
      return NextResponse.json({
        ok: false,
        status,
        reason: result.error,
        raw: portoneJson,
      });
    }

    return NextResponse.json({
      ok: true,
      status,
      amount: paidAmount,
      paymentId: imp_uid,
    });
  } catch (err) {
    console.error("[charge/confirm]", err);
    return NextResponse.json({
      ok: false,
      status: null,
      reason: err instanceof Error ? err.message : "Internal error",
      raw: null,
    });
  }
}
