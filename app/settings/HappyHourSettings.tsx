"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Card } from "@/components/ui";
import { PrimaryButton } from "@/components/ui";
import { Toggle } from "@/components/ui/Toggle";

function formatTimeForInput(timeStr: string | null): string {
  if (!timeStr) return "14:00";
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const h = match[1].padStart(2, "0");
    const m = match[2].padStart(2, "0");
    return `${h}:${m}`;
  }
  return "14:00";
}

export function HappyHourSettings() {
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:00");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      const supabase = createClient();
      const { data } = await supabase
        .from("happy_hour_config")
        .select("start_time, end_time, enabled")
        .eq("id", 1)
        .maybeSingle();

      if (data) {
        setStartTime(formatTimeForInput(data.start_time));
        setEndTime(formatTimeForInput(data.end_time));
        setEnabled(data.enabled ?? true);
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("happy_hour_config")
        .upsert(
          {
            id: 1,
            start_time: startTime,
            end_time: endTime,
            enabled,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) {
        setMessage(`저장 실패: ${error.message}`);
        return;
      }
      setMessage("저장되었습니다.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="py-4 text-center text-sm text-zinc-500">로딩 중...</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-4 font-semibold text-zinc-900">해피아워 설정</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700">상태</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">{enabled ? "ON" : "OFF"}</span>
            <Toggle checked={enabled} onChange={setEnabled} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              시작 시간
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="min-h-14 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              종료 시간
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="min-h-14 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.startsWith("저장") ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <PrimaryButton type="button" onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </PrimaryButton>
      </div>
    </Card>
  );
}
