"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 shadow-lg md:p-12">
      <div className="relative z-10">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
          네이버 블로그·카페·티스토리
          <br />
          <span className="text-blue-400">입찰형 포스팅</span>으로 한 번에 해결하세요
        </h1>
        <p className="mt-3 text-lg font-medium text-zinc-300 md:text-xl">
          입찰가에 따라 우선순위 포스팅이 자동 진행됩니다.
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          <span className="inline-flex items-center rounded-lg bg-indigo-500/30 px-2 py-0.5 font-semibold text-indigo-200">최소 70원</span>
          {" "}부터 — 상위 입찰 완료 후 하위 입찰이 순차 처리
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/charge"
            prefetch={false}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-600 hover:shadow-xl"
          >
            일반충전
          </Link>
          <Link
            href="/subscribe"
            prefetch={false}
            className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/50"
          >
            정기구독
          </Link>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          결제 후 서버 자원 즉시 할당 — 크레딧 환불 불가
        </p>
      </div>
    </section>
  );
}
