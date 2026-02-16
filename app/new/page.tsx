"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { MobileShell } from "@/components/layout/MobileShell";
import { Input, PrimaryButton, Select } from "@/components/ui";
import { Card } from "@/components/ui";
import { Toast } from "@/components/ui/Toast";

export default function NewPostingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [phone, setPhone] = useState("");
  const [kakao, setKakao] = useState("");
  const [insta, setInsta] = useState("");
  const [address, setAddress] = useState("");
  const [placeUrl, setPlaceUrl] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [postingMethod, setPostingMethod] = useState("direct");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const amount = parseInt(bidAmount, 10);
    if (isNaN(amount) || amount < 70) {
      setError("입찰가는 최소 70원 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("place_bid", {
        p_keyword: keyword,
        p_phone: phone || null,
        p_kakao: kakao || null,
        p_insta: insta || null,
        p_address: address || null,
        p_place_url: placeUrl || null,
        p_bid_amount: amount,
        p_posting_method: postingMethod,
      });

      if (rpcError) {
        console.error(rpcError);
        const err = rpcError as { message?: string; code?: string; details?: string; hint?: string };
        const fullMessage = [err.code, err.message, err.details, err.hint]
          .filter(Boolean)
          .join(" · ");
        setError(fullMessage || "RPC 호출에 실패했습니다.");
        setLoading(false);
        return;
      }

      if (data) {
        setToast("입찰 등록 완료");
        setTimeout(() => {
          router.push("/my");
          router.refresh();
        }, 1500);
      } else {
        setError("등록에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "등록 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell title="포스팅 등록">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 break-words">
            {error}
          </div>
        )}

        <Card>
          <h3 className="mb-4 font-semibold text-zinc-900">기본 정보</h3>
          <div className="space-y-4">
            <Input
              label="키워드"
              placeholder="예: 맛집, 카페"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                사진
              </label>
              <div className="flex min-h-32 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50">
                <p className="text-sm text-zinc-500">
                  사진을 드래그하거나 클릭하여 업로드
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-zinc-900">연락처</h3>
          <div className="space-y-4">
            <Input
              label="전화번호"
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="카카오톡 ID"
              placeholder="카카오톡 ID"
              value={kakao}
              onChange={(e) => setKakao(e.target.value)}
            />
            <Input
              label="인스타그램"
              placeholder="@username"
              value={insta}
              onChange={(e) => setInsta(e.target.value)}
            />
            <Input
              label="주소"
              placeholder="상세 주소"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-zinc-900">플레이스</h3>
          <Input
            label="플레이스 주소"
            placeholder="네이버/카카오 플레이스 URL"
            value={placeUrl}
            onChange={(e) => setPlaceUrl(e.target.value)}
          />
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-zinc-900">입찰 정보</h3>
          <div className="space-y-4">
            <Input
              label="입찰가 (원)"
              type="number"
              placeholder="70"
              min={70}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              required
            />
            <Select
              label="포스팅 방식"
              options={[
                { value: "direct", label: "직접 포스팅" },
                { value: "agency", label: "대행 포스팅" },
              ]}
              value={postingMethod}
              onChange={(e) => setPostingMethod(e.target.value)}
            />
          </div>
        </Card>

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "등록 중..." : "등록하기"}
        </PrimaryButton>
      </form>

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </MobileShell>
  );
}
