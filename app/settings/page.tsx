import Link from "next/link";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui";
import { HappyHourSettings } from "./HappyHourSettings";

export default function SettingsPage() {
  return (
    <MobileShell title="설정">
      <div className="space-y-4">
        <HappyHourSettings />

        <Card>
          <Link
            href="/login"
            className="block py-2 font-medium text-zinc-900"
          >
            로그인
          </Link>
        </Card>
        <Card>
          <p className="py-2 text-sm text-zinc-500">버전 0.1.0</p>
        </Card>
      </div>
    </MobileShell>
  );
}
