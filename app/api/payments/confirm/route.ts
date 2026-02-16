import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

function fail(status: number, reason: string, detail?: unknown) {
  const body = { ok: false, reason, detail: detail ?? undefined };
  return NextResponse.json(body, { status });
}

/**
 * POST /api/payments/confirm
 * Body: { paymentId: string, purpose?: "charge" | "subscription" }
 *   또는 기존: { imp_uid, purpose }
 *
 * paymentId = PortOne 결제 ID (조회용)
 * orderRef = PortOne 응답 merchant_order_ref 또는 body.merchant_uid
 */
const PORTONE_BASE = "https://api.portone.io";

export async function POST(request: Request) {
  try {
    const secretRaw = process.env.PORTONE_API_SECRET ?? "";
    const secret = secretRaw.trim();
    const authHeader = `PortOne ${secret}`;

    // 디버그: 원인 100% 확정용 (비밀값 전체 출력 금지)
    console.log("[payments/confirm] PORTONE_API_SECRET exists:", !!secretRaw);
    console.log("[payments/confirm] PORTONE_API_SECRET length:", secret.length);
    console.log("[payments/confirm] secret first 8:", secret.slice(0, 8));
    console.log("[payments/confirm] secret last 4:", secret.slice(-4));
    console.log("[payments/confirm] authHeader startsWith 'PortOne ':", authHeader.startsWith("PortOne "));

    if (!secret) {
      return NextResponse.json({ ok: false, reason: "PORTONE_API_SECRET missing" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const paymentId = (body?.paymentId ?? body?.imp_uid) as string | undefined;
    const purpose = body?.purpose as string | undefined;

    console.log("[payments/confirm] body", JSON.stringify(body));
    console.log("[payments/confirm] paymentId", paymentId);

    if (!paymentId) {
      return fail(400, "paymentId missing");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return fail(401, "Unauthorized");
    }

    const portoneUrl = `${PORTONE_BASE}/payments/${encodeURIComponent(paymentId)}`;
    console.log("[payments/confirm] PortOne 호출 URL:", portoneUrl);

    const paymentRes = await fetch(portoneUrl, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const portoneJson = await paymentRes.json().catch(() => ({}));
    console.log("[payments/confirm] PortOne 응답 status:", paymentRes.status);
    console.log("[payments/confirm] PortOne 응답 body:", JSON.stringify(portoneJson, null, 2));

    if (paymentRes.status === 401) {
      return NextResponse.json({
        ok: false,
        reason: "PortOne 조회 401(UNAUTHORIZED). PORTONE_API_SECRET이 'API Keys'의 TEST/LIVE와 결제 채널(TEST/LIVE)이 일치해야 합니다. 또한 env 공백/개행이 섞이면 실패합니다.",
        detail: { httpStatus: 401, secretLen: secret.length, secretPrefix: secret.slice(0, 8) },
      }, { status: 400 });
    }

    if (paymentRes.status >= 400) {
      return fail(400, `PortOne 조회 실패 (HTTP ${paymentRes.status})`, { portoneJson });
    }

    const raw = portoneJson as Record<string, unknown>;
    const payment = (raw?.payment ?? raw?.data ?? raw) as Record<string, unknown>;
    const paymentTyped = payment as {
      amount?: { total?: number } | number;
      status?: string;
      merchantOrderRef?: string;
      merchant_order_ref?: string;
      order_ref?: string;
    };
    const st = (paymentTyped?.status ?? "").toString();
    const statusUpper = st.toUpperCase();
    const amt = paymentTyped?.amount && typeof paymentTyped.amount === "object"
      ? paymentTyped.amount.total
      : paymentTyped?.amount;
    const paidAmount = Number(amt ?? 0);

    // orderRef: PortOne 응답에서 찾되, 없으면 paymentId로 대체
    const pj = portoneJson as Record<string, unknown>;
    const order = pj?.order as Record<string, unknown> | undefined;
    const orderRef =
      pj?.merchantOrderRef ||
      order?.merchantOrderRef ||
      pj?.merchant_order_ref ||
      order?.merchant_order_ref ||
      paymentTyped?.merchantOrderRef ||
      paymentTyped?.merchant_order_ref ||
      (raw?.merchant_order_ref as string | undefined) ||
      (raw?.merchantOrderRef as string | undefined) ||
      paymentId;

    const { data: readyEvent } = await supabase
      .from("payment_events")
      .select("id, subscription_id, user_id, amount, purpose")
      .eq("provider", "portone")
      .eq("status", "ready")
      .or(`provider_payment_id.eq.${paymentId},provider_event_id.eq.${orderRef}`)
      .maybeSingle();

    if (!readyEvent) {
      return fail(404, "결제 준비 정보를 찾을 수 없습니다.", { orderRef, paymentId });
    }

    const expectedAmount = readyEvent.amount ?? 0;
    const amountMatch = expectedAmount > 0 && paidAmount === expectedAmount;

    if (!amountMatch) {
      await supabase
        .from("payment_events")
        .update({ status: "failed", event_type: "payment.failed" })
        .eq("id", readyEvent.id);
      return fail(400, `결제 금액 불일치 (예상: ${expectedAmount}원, 실제: ${paidAmount}원)`, { portoneJson });
    }

    if (readyEvent.user_id !== user.id) {
      return fail(403, "결제 정보가 일치하지 않습니다.");
    }

    const IN_PROGRESS = ["READY", "PROCESSING", "PENDING"];
    const isInProgress = IN_PROGRESS.some((s) => statusUpper.includes(s));

    if (statusUpper !== "PAID") {
      return NextResponse.json({
        ok: false,
        reason: isInProgress ? "결제 진행중" : (st ? `결제 미완료 (status: ${st})` : "결제 상태 확인 실패"),
        detail: { status: st, portoneJson },
      });
    }

    const resolvedPurpose = purpose ?? readyEvent.purpose ?? "subscription";

    await supabase
      .from("payment_events")
      .update({
        status: "paid",
        provider_payment_id: paymentId,
        provider_event_id: orderRef,
        raw: portoneJson,
        event_type: resolvedPurpose === "charge" ? "charge.succeeded" : "payment.succeeded",
      })
      .eq("id", readyEvent.id);

    if (resolvedPurpose === "charge") {
      const admin = createAdminClient();
      const chargeAmount = Math.floor(paidAmount);
      console.log("[confirm] rpc args", {
        userId: user.id,
        amount: chargeAmount,
        provider: "portone",
        providerEventId: orderRef,
      });

      const { data: rpcData, error: rpcError } = await admin.rpc("apply_charge_payment", {
        p_user_id: user.id,
        p_amount: chargeAmount,
        p_provider: "portone",
        p_provider_event_id: orderRef,
      });

      console.log("[confirm] rpc result", { rpcData, rpcError });

      if (rpcError) {
        console.error("[payments/confirm] apply_charge_payment:", rpcError);
        return fail(500, rpcError.message, { rpcError });
      }

      const result = rpcData as { success?: boolean; duplicate?: boolean; error?: string };
      if (result?.success === false && result?.error) {
        return fail(400, result.error);
      }

      const { data: balanceRow } = await admin.from("users").select("balance").eq("id", user.id).maybeSingle();
      console.log("[confirm] users.balance after charge", { userId: user.id, balance: balanceRow?.balance });

      return NextResponse.json({
        ok: true,
        amount: paidAmount,
        paymentId,
        duplicate: result?.duplicate ?? false,
      });
    }

    const providerEventId = (pj?.id ?? pj?.transactionId ?? orderRef) as string;

    let subBonusRate: number | null = null;
    if (readyEvent.subscription_id) {
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("status, bonus_rate")
        .eq("id", readyEvent.subscription_id)
        .eq("user_id", user.id)
        .single();

      if (subData?.bonus_rate != null) {
        subBonusRate = Number(subData.bonus_rate);
      }

      if (subData?.status === "draft") {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        await supabase.rpc("activate_subscription", {
          p_subscription_id: readyEvent.subscription_id,
          p_provider: "portone",
          p_provider_customer_id: user.id,
          p_provider_subscription_id: paymentId,
          p_next_billing_at: nextMonth.toISOString(),
        });
      }
    }

    const subAmount = Math.floor(paidAmount);
    const pBonus = subBonusRate != null
      ? Math.floor(subAmount * subBonusRate)
      : Math.floor(subAmount * 0.1);

    const admin = createAdminClient();
    const rpcArgs = {
      p_user_id: user.id,
      p_amount: subAmount,
      p_bonus: pBonus,
      p_provider: "portone",
      p_provider_event_id: providerEventId,
    };
    console.log("[confirm] apply_subscription_payment args", rpcArgs);

    const { data: rpcData, error: rpcError } = await admin.rpc("apply_subscription_payment", rpcArgs);

    console.log("[confirm] apply_subscription_payment result", { rpcData, rpcError });

    if (rpcError) {
      console.error("[payments/confirm] apply_subscription_payment:", rpcError);
      return fail(500, rpcError.message, { rpcError });
    }

    const result = rpcData as { success?: boolean; duplicate?: boolean; error?: string };
    if (result?.success === false && result?.error) {
      return fail(400, result.error);
    }

    return NextResponse.json({
      ok: true,
      amount: paidAmount,
      paymentId,
      purpose: "subscription",
      duplicate: result?.duplicate ?? false,
    });
  } catch (err) {
    console.error("[payments/confirm]", err);
    return fail(500, err instanceof Error ? err.message : "Internal error", err);
  }
}
