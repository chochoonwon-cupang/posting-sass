"use client";

const pains = [
  {
    icon: "✍️",
    title: "매번 올릴 글이 고민",
    desc: "콘텐츠 기획부터 작성까지, 매번 새로 고민하시나요?",
  },
  {
    icon: "⏱️",
    title: "대량 포스팅은 시간이 너무 듦",
    desc: "여러 채널에 반복 업로드하는 데 시간이 쏟아집니다.",
  },
  {
    icon: "📊",
    title: "우선순위 조절이 안됨",
    desc: "어떤 글이 먼저 올라가야 할지 제어가 어렵습니다.",
  },
  {
    icon: "🎯",
    title: "저가 입찰은 기회가 없음",
    desc: "낮은 입찰가는 대기만 하다 끝나는 경우가 많았죠.",
  },
];

export function PainSection() {
  return (
    <section className="py-12 md:py-16">
      <h2 className="text-center text-xl font-bold text-zinc-900 md:text-2xl">
        마케팅이 본업보다 힘들지 않나요?
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-600">
        포스팅도우미가 해결해 드립니다.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {pains.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
