import { MobileShell } from "@/components/layout/MobileShell";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
      <div className="mt-2 h-8 w-24 animate-pulse rounded bg-zinc-200" />
    </div>
  );
}

export default function ChargeLoading() {
  return (
    <MobileShell title="충전">
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
        <div className="flex gap-3">
          <div className="h-12 flex-1 animate-pulse rounded-xl bg-zinc-200" />
          <div className="h-12 flex-1 animate-pulse rounded-xl bg-zinc-200" />
          <div className="h-12 flex-1 animate-pulse rounded-xl bg-zinc-200" />
        </div>
        <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-200" />
        <div className="h-14 w-full animate-pulse rounded-xl bg-zinc-200" />
      </div>
    </MobileShell>
  );
}
