import { MobileShell } from "@/components/layout/MobileShell";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
      <div className="mt-2 h-6 w-32 animate-pulse rounded bg-zinc-200" />
    </div>
  );
}

export default function SubscribeLoading() {
  return (
    <MobileShell title="정기구독">
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4">
          <div className="h-14 w-28 animate-pulse rounded-lg bg-zinc-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
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
