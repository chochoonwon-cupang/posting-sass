"use client";

export function RefundNotice() {
  return (
    <section className="py-8">
      <div className="flex gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
        <span className="text-2xl" aria-hidden>⚠️</span>
        <div>
          <p className="font-bold text-amber-900">
            본 서비스는 서버 자원 즉시 할당 시스템으로 결제 후 크레딧 환불이 불가합니다.
          </p>
          <p className="mt-2 font-semibold text-amber-800">
            충전 전 신중한 확인 부탁드립니다.
          </p>
        </div>
      </div>
    </section>
  );
}
