"use client";

import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="py-12 md:py-16">
      <h2 className="text-center text-2xl font-bold text-white md:text-3xl">
        5분만에 입찰형 포스팅 시작하기
      </h2>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
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
    </section>
  );
}
