import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { MobileShell } from "@/components/layout/MobileShell";
import { Badge, Card } from "@/components/ui";

const STATUS_BADGE: Record<string, "waiting" | "progress" | "completed"> = {
  pending: "waiting",
  in_progress: "progress",
  done: "completed",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  in_progress: "진행중",
  done: "완료",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MyPostingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: bids } = await supabase
    .from("bids")
    .select("id, keyword, status, publish_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <MobileShell title="내 포스팅">
      <div className="space-y-4">
        {!bids?.length ? (
          <Card className="py-8 text-center text-zinc-500">
            등록한 입찰이 없습니다.
          </Card>
        ) : (
          bids.map((bid) => (
            <Card key={bid.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-zinc-900">{bid.keyword}</h3>
                <Badge variant={STATUS_BADGE[bid.status] ?? "waiting"}>
                  {STATUS_LABEL[bid.status] ?? bid.status}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">{formatDate(bid.created_at)}</p>
              {bid.publish_url ? (
                <div className="rounded-lg bg-zinc-100 p-3">
                  <p className="text-xs text-zinc-500">발행 URL</p>
                  <Link
                    href={bid.publish_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm font-medium text-indigo-600 underline"
                  >
                    {bid.publish_url}
                  </Link>
                </div>
              ) : (
                <div className="rounded-lg bg-zinc-100 p-3">
                  <p className="text-sm text-zinc-500">발행 대기 중</p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </MobileShell>
  );
}
