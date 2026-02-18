"use client";

export function HappyHourSection() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white px-6 py-10 shadow-lg md:py-12">
      <h2 className="text-center text-2xl font-bold text-zinc-900 md:text-3xl">
        해피아워: 하위 입찰에도 기회
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-600">
        <span className="inline-flex items-center rounded-lg bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">하루 2시간</span> 랜덤 해피아워
      </p>

      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <p className="text-center text-sm leading-6 text-zinc-700">
          해피아워 시작 시점까지 미진행된 하위 입찰 포스팅이 랜덤으로 작성 기회를 얻습니다.
        </p>
        <p className="mt-3 text-center text-xs text-indigo-600">
          ※ 입찰 금액과 관계없이 랜덤 기회
        </p>
      </div>
    </section>
  );
}
