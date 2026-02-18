import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function toKstISOString(d: Date) {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const iso = kst.toISOString().replace("Z", "+09:00");
  return iso;
}

export async function GET() {
  // TODO: Supabase에서 오늘의 해피아워 start/end 조회로 교체
  const now = new Date();
  const seed = Math.floor((now.getUTCFullYear() + now.getUTCMonth() + now.getUTCDate()) % 18);
  const startHour = 6 + seed;
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), startHour - 9, 0, 0)
  );
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  return NextResponse.json({
    ok: true,
    startKst: toKstISOString(start),
    endKst: toKstISOString(end),
    note: "임시 더미 데이터(추후 서버/DB 연동 예정)",
  });
}
