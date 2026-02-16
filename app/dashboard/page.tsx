import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: userProfile } = await supabase
    .from("users")
    .select("balance")
    .eq("id", user.id)
    .maybeSingle();

  if (!userProfile) {
    const { error } = await supabase.from("users").upsert(
      { id: user.id, balance: 0 },
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (!error) {
      userProfile = { balance: 0 };
    } else {
      const { data } = await supabase
        .from("users")
        .select("balance")
        .eq("id", user.id)
        .maybeSingle();
      userProfile = data ?? { balance: 0 };
    }
  }

  const balance = userProfile?.balance ?? 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const { count: pendingCount } = await supabase
    .from("bids")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");

  const { count: processingCount } = await supabase
    .from("bids")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "in_progress");

  const { count: doneCount } = await supabase
    .from("bids")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "done")
    .gte("created_at", todayStart.toISOString())
    .lt("created_at", todayEnd.toISOString());

  const { data: happyHour } = await supabase
    .from("happy_hour_config")
    .select("start_time, end_time, enabled")
    .eq("id", 1)
    .maybeSingle();

  const formatTime = (t: string | null) => {
    if (!t) return "";
    const m = String(t).match(/(\d{1,2}):(\d{2})/);
    return m ? `${m[1].padStart(2, "0")}:${m[2]}` : String(t);
  };

  return (
    <MobileShell title="대시보드">
      <DashboardClient
        balance={balance}
        pendingCount={pendingCount ?? 0}
        processingCount={processingCount ?? 0}
        doneCount={doneCount ?? 0}
        happyHourStart={formatTime(happyHour?.start_time ?? null)}
        happyHourEnd={formatTime(happyHour?.end_time ?? null)}
        happyHourEnabled={happyHour?.enabled ?? true}
      />
    </MobileShell>
  );
}
