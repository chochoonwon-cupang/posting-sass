"use client";

const pains = [
  {
    icon: "🤖",
    title: "입찰형 자동 발행",
    desc: "키워드 입력 후 입찰가에 따라 우선순위가 결정되고, 자동으로 포스팅이 진행됩니다.",
  },
  {
    icon: "🔄",
    title: "상위 입찰 우선 처리",
    desc: "높은 입찰가가 먼저 처리되어, 원하는 순서로 포스팅을 제어할 수 있습니다.",
  },
  {
    icon: "📅",
    title: "해피아워 랜덤 기회",
    desc: "하루 2시간 랜덤 해피아워에 하위 입찰도 랜덤으로 포스팅 기회를 얻습니다.",
  },
  {
    icon: "🚀",
    title: "멀티 플랫폼 발행",
    desc: "블로그·카페·티스토리로 뷰탭 기준 자동 분배되어 노출을 극대화합니다.",
  },
];

export function PainSection() {
  return (
    <section className="py-12 md:py-16">
      <h2 className="text-center text-2xl font-bold text-white md:text-3xl">
        포스팅 도우미 핵심 기능
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-400">
        입찰형 포스팅으로 한 번에 해결
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {pains.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-white/10 bg-white p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <span className="text-2xl">{item.icon}</span>
            <h3 className="mt-2 font-semibold text-zinc-900">{item.title}</h3>
            <p className="mt-1 text-sm text-zinc-600">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
