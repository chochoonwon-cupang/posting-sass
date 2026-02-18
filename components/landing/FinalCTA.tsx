"use client";

import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="py-12 md:py-16">
      <h2 className="text-center text-2xl font-bold text-zinc-900 md:text-3xl">
        5분만에 입찰형 포스팅 시작하기
      </h2>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
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
    </section>
  );
}
