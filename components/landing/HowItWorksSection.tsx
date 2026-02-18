"use client";

const steps = [
  {
    badge: "STEP 01",
    icon: "💰",
    title: "입찰(최소 70원)",
    desc: "원하는 키워드로 포스팅을 등록하고, 최소 70원부터 입찰합니다.",
  },
  {
    badge: "STEP 02",
    icon: "⬆️",
    title: "상위 입찰 우선 처리",
    desc: "높은 입찰가가 먼저 처리됩니다. 네이버 광고처럼 우선순위가 결정됩니다.",
  },
  {
    badge: "STEP 03",
    icon: "🔄",
    title: "상위 완료 후 하위 순차 진행",
    desc: "상위 입찰이 모두 완료되면, 하위 입찰이 순차적으로 진행됩니다.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-12 md:py-16">
      <h2 className="text-center text-xl font-bold text-zinc-900 md:text-2xl">
        입찰형 포스팅, 이렇게 진행됩니다
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-600">
        입찰 → 우선순위 → 완료 후 다음
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.badge}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="inline-block rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {step.badge}
            </span>
            <span className="mt-3 block text-3xl">{step.icon}</span>
            <h3 className="mt-2 font-semibold text-zinc-900">{step.title}</h3>
            <p className="mt-2 text-sm text-zinc-600">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
