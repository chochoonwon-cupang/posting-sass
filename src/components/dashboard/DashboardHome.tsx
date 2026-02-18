"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HappyHourToday =
  | {
      ok: true;
      startKst: string;
      endKst: string;
      note?: string;
    }
  | { ok: false; message: string };

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/90">
      {children}
    </span>
  );
}

function Card({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {right}
      </div>
      <div className="text-sm leading-6 text-white/80">{children}</div>
    </div>
  );
}

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
      className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
    >
      {children}
    </Link>
  );
}

function GhostButton({
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
      className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

export default function DashboardHome() {
  const [happyHour, setHappyHour] = useState<HappyHourToday>({
    ok: false,
    message: "불러오는 중...",
  });

  useEffect(() => {
    let mounted = true;
    fetch("/api/happyhour/today", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setHappyHour(data);
      })
      .catch(() => {
        if (!mounted) return;
        setHappyHour({ ok: false, message: "오늘의 해피아워 정보를 불러오지 못했어요." });
      });
    return () => {
      mounted = false;
    };
  }, []);

  const happyHourText = useMemo(() => {
    if (!happyHour.ok) return happyHour.message;
    return `${new Date(happyHour.startKst).toLocaleString("ko-KR")} ~ ${new Date(
      happyHour.endKst
    ).toLocaleString("ko-KR")}`;
  }, [happyHour]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* HERO */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>입찰형</Badge>
                <Badge>70원부터</Badge>
                <Badge>해피아워 랜덤 2시간</Badge>
                <Badge>블로그·카페·티스토리</Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                입찰형 포스팅 포스팅도우미
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/75">
                원하는 키워드 포스팅을 <b className="text-white">입찰(70원~)</b>로 등록하면 서버에 즉시 접수되어 대기열에 저장됩니다.
                높은 입찰가가 우선 처리되며, 네이버 뷰탭 기준 상위노출 우선도에 따라 <b className="text-white">자동으로 발행 채널(블로그/카페/티스토리)</b>이 결정됩니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <PrimaryButton href="/new">포스팅 등록</PrimaryButton>
              <GhostButton href="/my">내 목록 보기</GhostButton>
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="입찰 처리 규칙" right={<Badge>우선순위 큐</Badge>}>
            <ul className="list-disc space-y-2 pl-5">
              <li>포스팅은 <b className="text-white">70원부터</b> 입찰로 등록 가능합니다.</li>
              <li>
                <b className="text-white">높은 금액 입찰</b>이 있으면, 그 금액의 작업이{" "}
                <b className="text-white">모두 완료</b>되어야 다음(낮은) 금액이 등록/진행됩니다.
              </li>
              <li>높은 금액 입찰자가 없으면 <b className="text-white">전체가 70원 기준</b>으로 진행됩니다.</li>
            </ul>
          </Card>

          <Card title="해피아워 (랜덤 2시간)" right={<Badge>확률 랜덤</Badge>}>
            <p className="mb-2">
              해피아워는 <b className="text-white">매일 랜덤한 2시간</b>으로 존재합니다.
              해당 시간에는 해피아워 시작 시점 기준으로 아직 처리되지 않은{" "}
              <b className="text-white">낮은 금액 입찰 포스팅</b>들이{" "}
              <b className="text-white">랜덤 확률</b>로 등록될 수 있습니다.
            </p>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
              <div className="text-white/70">오늘의 해피아워</div>
              <div className="mt-1 font-semibold text-white">{happyHourText}</div>
              <div className="mt-1 text-xs text-white/60">
                * 실제 시간은 서버 정책에 따라 매일 변경됩니다.
              </div>
            </div>
            <p className="mt-3 text-sm text-white/75">
              해피아워를 활용하려면, <b className="text-white">낮은 금액으로 미리 입찰</b>해두는 것도 좋은 전략입니다.
            </p>
          </Card>

          <Card title="충전/정기구독 보너스 정책" right={<Badge>보너스 충전</Badge>}>
            <ul className="list-disc space-y-2 pl-5">
              <li>일반 충전: 결제한 금액만큼 크레딧이 충전됩니다.</li>
              <li>
                정기구독: 보너스 금액이 추가로 충전됩니다
                <div className="mt-2 grid gap-2 rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                  <div>• 30만원 이상: <b className="text-white">10%</b> 보너스</div>
                  <div>• 100만원 이상: <b className="text-white">20%</b> 보너스</div>
                  <div>• 300만원 이상: <b className="text-white">30%</b> 보너스</div>
                </div>
              </li>
            </ul>
          </Card>

          <Card
            title="중요 안내 (환불 불가)"
            right={<Badge>필독</Badge>}
          >
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
              본 서비스는 <b className="text-white">서버 자원 즉시 할당 시스템</b>으로 결제 후{" "}
              <b className="text-white">크레딧 환불이 불가</b>합니다. 충전 전 신중한 확인 부탁드립니다.
            </div>
            <p className="mt-3 text-sm text-white/75">
              결제/충전 정책은 서비스 운영 상황 및 정책 변경에 따라 조정될 수 있습니다.
            </p>
          </Card>
        </div>

        {/* SECOND GRID */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card title="발행 채널" right={<Badge>자동 발행</Badge>}>
            <p>
              포스팅은 제휴 등록된 블로그를 포함하여 <b className="text-white">블로그 · 카페 · 티스토리</b>로 자동 발행됩니다.
            </p>
          </Card>

          <Card title="자동 분배 로직" right={<Badge>뷰탭 기준</Badge>}>
            <p>
              네이버 뷰탭 기준 상위노출 우선도에 따라, <b className="text-white">유리한 영역</b>으로 자동 결정되어 등록됩니다.
              사용자 임의로 블로그/카페/티스토리 비율을 직접 설정할 수 없습니다.
            </p>
          </Card>

          <Card title="내 목록에서 확인" right={<Badge>순위/링크</Badge>}>
            <ul className="list-disc space-y-2 pl-5">
              <li>내 포스팅의 <b className="text-white">발행 링크</b> 확인</li>
              <li>메인 뷰탭 순위 및 <b className="text-white">영역별 순위</b> 확인</li>
              <li>등록 상태: 접수 → 대기 → 발행 완료</li>
            </ul>
          </Card>
        </div>

        <div className="mt-8 text-center text-xs text-white/50">
          © {new Date().getFullYear()} 입찰형 포스팅 포스팅도우미
        </div>
      </div>
    </div>
  );
}
