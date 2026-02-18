"use client";

export function SeventyWonSection() {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-lg md:flex-row md:items-center md:justify-between md:p-12">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-white md:text-3xl">
          70원부터 시작하는 입찰형 포스팅
        </h2>
        <p className="mt-3 text-zinc-300 md:text-lg">
          소액 입찰로도 참여 가능하고, 상위 입찰이 먼저 처리됩니다.
        </p>
      </div>

      <div className="flex-shrink-0">
        <div
          className="animate-70-fade-in relative overflow-hidden rounded-2xl border border-white/20 bg-white p-5 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          style={{
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
          }}
        >
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <p className="text-4xl font-bold text-indigo-600 md:text-5xl">70원</p>
          <p className="mt-1 text-sm font-semibold text-zinc-600">최소 입찰가</p>
        </div>
      </div>
    </section>
  );
}
