import { MobileShell } from "@/components/layout/MobileShell";

export default function DashboardLoading() {
  return (
    <MobileShell title="포스팅 도우미" wide showLogo>
      <div className="min-h-[calc(100vh-64px)] bg-[#1e1b4b]">
        <div className="space-y-16 py-8 md:py-12">
          <div className="h-12 animate-pulse rounded-xl bg-white/10" />
          <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </MobileShell>
  );
}
