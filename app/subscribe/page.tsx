import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { MobileShell } from "@/components/layout/MobileShell";
import { SubscribeClient } from "./SubscribeClient";

export const revalidate = 5;

export default async function SubscribePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error: rpcError } = await supabase.rpc("ensure_draft_subscription", {
    p_user_id: user.id,
  });

  if (rpcError) {
    console.error("[ensure_draft_subscription] error:", JSON.stringify(rpcError, null, 2));
  }

  let { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status, monthly_amount, m300_qty, m500_qty, m1000_qty")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!subscription) {
    const { data: fallback } = await supabase
      .from("subscriptions")
      .select("id, status, monthly_amount, m300_qty, m500_qty, m1000_qty")
      .eq("user_id", user.id)
      .maybeSingle();
    subscription = fallback ?? null;
  }

  return (
    <MobileShell title="정기구독">
      <SubscribeClient subscription={subscription} userId={user.id} />
    </MobileShell>
  );
}
