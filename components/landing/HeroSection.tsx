"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 shadow-lg md:p-12">
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="order-2 flex-1 md:order-1">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            입찰 70원부터, 포스팅이 자동으로 진행됩니다.
          </h1>
          <p className="mt-3 text-lg font-medium text-zinc-300 md:text-xl">
            상위 입찰이 완료되면 하위 입찰이 순차 처리됩니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/charge"
              prefetch={false}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-600 hover:shadow-xl"
            >
              70원으로 시작하기 (일반충전)
            </Link>
            <Link
              href="/subscribe"
              prefetch={false}
              className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/50"
            >
              정기구독으로 보너스 받기
            </Link>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            결제 후 서버 자원 즉시 할당 — 크레딧 환불 불가
          </p>
        </div>

        <div className="order-1 relative flex-shrink-0 md:order-2 md:min-w-[200px]">
          <div
            className="animate-70-fade-in relative overflow-hidden rounded-2xl border border-white/20 bg-white p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
            }}
          >
            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <p className="text-6xl font-bold text-indigo-600 md:text-7xl">70원</p>
            <p className="mt-1 text-sm font-semibold text-zinc-600">최소 입찰가</p>
            <p className="mt-0.5 text-xs text-zinc-500">부담 없이 시작</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-200">
          ✅ 최소 70원부터
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-200">
          ⏱ 하루 2시간 해피아워
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-200">
          ⚡ 입찰 우선순위 자동 처리
        </span>
      </div>
    </section>
  );
}
