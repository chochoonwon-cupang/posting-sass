import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui";
import { DashboardSummaryCard } from "@/components/DashboardSummaryCard";
import { HappyHourSettings } from "./HappyHourSettings";

function formatTime(t: string | null) {
  if (!t) return "";
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : String(t);
}

export default async function SettingsPage() {
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
    <MobileShell title="내정보">
      <div className="space-y-4">
        <DashboardSummaryCard
          balance={balance}
          pendingCount={pendingRes.count ?? 0}
          processingCount={processingRes.count ?? 0}
          doneCount={doneRes.count ?? 0}
          happyHourStart={formatTime(happyHour?.start_time ?? null)}
          happyHourEnd={formatTime(happyHour?.end_time ?? null)}
          happyHourEnabled={happyHour?.enabled ?? true}
        />

        <HappyHourSettings
          initialStartTime={happyHour?.start_time ?? null}
          initialEndTime={happyHour?.end_time ?? null}
          initialEnabled={happyHour?.enabled ?? true}
        />

        <Card>
          <Link
            href="/login"
            className="block py-2 font-medium text-zinc-900"
          >
            로그인
          </Link>
        </Card>
        <Card>
          <p className="py-2 text-sm text-zinc-500">버전 0.1.0</p>
        </Card>
      </div>
    </MobileShell>
  );
}
