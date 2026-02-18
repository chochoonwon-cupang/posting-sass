"use client";

export function ChargingSection() {
  return (
    <section className="py-12 md:py-16">
      <h2 className="text-center text-2xl font-bold text-white md:text-3xl">
        충전 정책
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-400">
        일반충전 vs 정기구독 보너스
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
          <h3 className="font-semibold text-zinc-900">일반충전</h3>
          <p className="mt-2 text-sm text-zinc-600">
            결제금액만큼 충전
          </p>
        </div>

        <div className="relative rounded-2xl border-2 border-indigo-400/50 bg-white p-6 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
          <span className="absolute -top-2.5 right-4 rounded-full bg-indigo-500 px-3 py-0.5 text-xs font-bold text-white">
            BEST
          </span>
          <h3 className="font-semibold text-zinc-900">정기구독 보너스</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li>100만원 미만: <strong className="text-blue-600">+10%</strong></li>
            <li>100만원 이상 ~ 300만원 미만: <strong className="text-blue-600">+20%</strong></li>
            <li>300만원 이상: <strong className="text-blue-600">+30%</strong></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
