import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { MobileShell } from "@/components/layout/MobileShell";
import DashboardHome from "@/src/components/dashboard/DashboardHome";

export const revalidate = 60;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headerRight = user ? (
    <Link
      href="/settings"
      prefetch={false}
      className="rounded-xl border border-white/30 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
    >
      내정보
    </Link>
  ) : (
    <>
      <Link
        href="/login"
        prefetch={false}
        className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
      >
        로그인
      </Link>
      <Link
        href="/signup"
        prefetch={false}
        className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
      >
        회원가입
      </Link>
    </>
  );

  return (
    <MobileShell title="포스팅 도우미" wide headerRight={headerRight} showLogo>
      <DashboardHome />
    </MobileShell>
  );
}
