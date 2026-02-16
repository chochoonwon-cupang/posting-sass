import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { MobileShell } from "@/components/layout/MobileShell";
import { ChargeClient } from "./ChargeClient";

export const revalidate = 5;

export default async function ChargePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("balance")
    .eq("id", user.id)
    .maybeSingle();

  const balance = userProfile?.balance ?? 0;

  return (
    <MobileShell title="충전">
      <ChargeClient initialBalance={balance} />
    </MobileShell>
  );
}
