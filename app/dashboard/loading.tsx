import { MobileShell } from "@/components/layout/MobileShell";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="h-4 w-16 animate-pulse rounded bg-zinc-200" />
      <div className="mt-2 h-8 w-24 animate-pulse rounded bg-zinc-200" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <MobileShell title="대시보드">
      <div className="space-y-4">
        <div className="rounded-xl border-0 bg-gradient-to-br from-indigo-500 to-indigo-700 p-4">
          <div className="h-4 w-12 animate-pulse rounded bg-white/30" />
          <div className="mt-2 h-9 w-28 animate-pulse rounded bg-white/40" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <SkeletonCard />
        <SkeletonCard />
      </div>
    </MobileShell>
  );
}
