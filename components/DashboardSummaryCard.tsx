"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { Card } from "@/components/ui";
import { Toggle } from "@/components/ui/Toggle";

interface DashboardSummaryCardProps {
  balance: number;
  pendingCount: number;
  processingCount: number;
  doneCount: number;
  happyHourStart?: string;
  happyHourEnd?: string;
  happyHourEnabled?: boolean;
}

export function DashboardSummaryCard({
  balance: initialBalance,
  pendingCount,
  processingCount,
  doneCount,
  happyHourStart = "14:00",
  happyHourEnd = "16:00",
  happyHourEnabled = true,
}: DashboardSummaryCardProps) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [pollingEnabled, setPollingEnabled] = useState(false);

  useEffect(() => {
    setBalance(initialBalance);
  }, [initialBalance]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("users-balance")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users" },
        async (payload) => {
          const row = payload.new as { id?: string; balance?: number };
          const { data } = await supabase.auth.getUser();
          if (data.user?.id === row?.id && typeof row.balance === "number") {
            setBalance(row.balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!pollingEnabled) return;
    const id = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(id);
  }, [pollingEnabled, router]);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
        <p className="text-sm font-medium opacity-90">잔액</p>
        <p className="mt-1 text-3xl font-bold">{balance.toLocaleString()}원</p>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-sm font-medium text-zinc-500">대기</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {pendingCount}건
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-zinc-500">진행중</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {processingCount}건
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-zinc-500">오늘 완료</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {doneCount}건
          </p>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm font-medium text-amber-800">해피아워</p>
        <p className="mt-1 text-lg font-semibold text-amber-900">
          {happyHourEnabled ? `${happyHourStart} ~ ${happyHourEnd}` : "OFF"}
        </p>
        <p className="mt-0.5 text-sm text-amber-700">
          {happyHourEnabled
            ? "지금 입찰하면 할인 적용!"
            : "현재 해피아워가 비활성화되어 있습니다."}
        </p>
      </Card>

      <Card className="border-zinc-200 bg-zinc-50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">DEV: 10초 폴링</span>
          <Toggle checked={pollingEnabled} onChange={setPollingEnabled} />
        </div>
      </Card>
    </div>
  );
}
