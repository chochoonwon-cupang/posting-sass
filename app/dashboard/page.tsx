import { createClient } from "@/src/lib/supabase/server";
import { MobileShell } from "@/components/layout/MobileShell";
import DashboardHome from "@/src/components/dashboard/DashboardHome";

export const revalidate = 60;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <MobileShell title="대시보드" wide>
      <DashboardHome isLoggedIn={!!user} />
    </MobileShell>
  );
}
