"use client";

import Link from "next/link";
import { Card } from "@/components/ui";

function PrimaryButton({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
    >
      {children}
    </Link>
  );
}

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      {/* (1) 헤드라인/서브카피 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">
          포스팅도우미 — 국내 최초 &apos;입찰형 포스팅&apos; 서비스
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          네이버 광고처럼 입찰가에 따라 우선순위가 결정되고, 서버 자원을 즉시 배정해 자동으로 포스팅이 진행됩니다.
        </p>
      </div>

      {/* (2) 작동 방식 */}
      <Card>
        <h2 className="text-base font-semibold text-zinc-900">작동 방식</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-600">
          <li>포스팅은 입찰 금액이 높은 건부터 우선 작성됩니다.</li>
          <li>낮은 입찰 금액의 포스팅은 상위 입찰 포스팅이 모두 완료된 후 순차적으로 진행됩니다.</li>
          <li>최소 입찰 금액은 70원부터 시작할 수 있습니다.</li>
        </ul>
      </Card>

      {/* (3) 해피아워 */}
      <Card>
        <h2 className="text-base font-semibold text-zinc-900">해피아워 (하루 2시간 랜덤)</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-600">
          <li>하루 중 랜덤 2시간, 해피아워가 열립니다.</li>
          <li>
            해피아워 시작 시점까지 작성되지 못한 하위 입찰 포스팅들은
            입찰 금액과 관계없이 랜덤으로 포스팅 기회를 받을 수 있습니다.
          </li>
        </ul>
      </Card>

      {/* (4) 충전 정책 */}
      <Card>
        <h2 className="text-base font-semibold text-zinc-900">충전 정책</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-600">
          <li>일반충전: 결제한 충전금액만큼 크레딧이 충전됩니다.</li>
          <li>
            정기구독(보너스 충전):
            <ul className="mt-2 list-inside space-y-1 text-zinc-600">
              <li>100만원 미만: +10%</li>
              <li>100만원 이상 ~ 300만원 미만: +20%</li>
              <li>300만원 이상: +30%</li>
            </ul>
          </li>
          <li>충전된 크레딧으로 포스팅 입찰을 진행할 수 있습니다.</li>
        </ul>
      </Card>

      {/* (5) 환불 안내 (강조) */}
      <Card className="border-amber-200 bg-amber-50">
        <h2 className="text-base font-semibold text-amber-900">환불 안내 (강조)</h2>
        <p className="mt-3 text-sm leading-6 text-amber-800">
          본 서비스는 서버 자원 즉시 할당 시스템으로 결제 후 크레딧 환불이 불가합니다.
          충전 전 신중한 확인 부탁드립니다.
        </p>
      </Card>

      {/* CTA 버튼 */}
      <div className="flex flex-wrap gap-3">
        <PrimaryButton href="/charge">일반충전</PrimaryButton>
        <PrimaryButton href="/subscribe">정기구독</PrimaryButton>
      </div>
    </div>
  );
}
