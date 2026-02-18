"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-black/5 bg-white p-8 shadow-sm md:p-12">
      <div className="relative z-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl lg:text-5xl">
          포스팅, 직접 하지 마세요.
        </h1>
        <p className="mt-3 text-lg font-medium text-indigo-700 md:text-xl">
          입찰가에 따라 우선순위 포스팅이 자동 진행됩니다.
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          <span className="inline-flex items-center rounded-lg bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700">최소 70원</span>
          {" "}부터 — 상위 입찰 완료 후 하위 입찰이 순차 처리
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/charge"
            prefetch={false}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow"
          >
            일반충전
          </Link>
          <Link
            href="/subscribe"
            prefetch={false}
            className="inline-flex items-center justify-center rounded-xl border-2 border-indigo-200 bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
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
