import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui";
import { HappyHourSettings } from "./HappyHourSettings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: happyHour } = await supabase
    .from("happy_hour_config")
    .select("start_time, end_time, enabled")
    .eq("id", 1)
    .maybeSingle();

  return (
    <MobileShell title="설정">
      <div className="space-y-4">
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
