import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { MobileShell } from "@/components/layout/MobileShell";
import { DashboardClient } from "./DashboardClient";

export const revalidate = 60;

function formatTime(t: string | null) {
  if (!t) return "";
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : String(t);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [
    userProfileRes,
    pendingRes,
    processingRes,
    doneRes,
    happyHourRes,
  ] = await Promise.all([
    supabase.from("users").select("balance").eq("id", user.id).maybeSingle(),
    supabase
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "in_progress"),
    supabase
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "done")
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", todayEnd.toISOString()),
    supabase
      .from("happy_hour_config")
      .select("start_time, end_time, enabled")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  let balance: number;
  if (userProfileRes.data != null) {
    balance = userProfileRes.data.balance ?? 0;
  } else {
    const { error } = await supabase.from("users").upsert(
      { id: user.id, balance: 0 },
      { onConflict: "id", ignoreDuplicates: true }
    );
    balance = error
      ? (await supabase.from("users").select("balance").eq("id", user.id).maybeSingle()).data
          ?.balance ?? 0
      : 0;
  }

  const happyHour = happyHourRes.data;

  return (
    <MobileShell title="대시보드">
      <DashboardClient
        balance={balance ?? 0}
        pendingCount={pendingRes.count ?? 0}
        processingCount={processingRes.count ?? 0}
        doneCount={doneRes.count ?? 0}
        happyHourStart={formatTime(happyHour?.start_time ?? null)}
        happyHourEnd={formatTime(happyHour?.end_time ?? null)}
        happyHourEnabled={happyHour?.enabled ?? true}
      />
    </MobileShell>
  );
}
