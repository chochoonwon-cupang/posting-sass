"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Input, PrimaryButton } from "@/components/ui";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(() => {
    const err = searchParams.get("error");
    if (!err) return null;
    try {
      return err === "auth"
        ? "인증에 실패했습니다. 다시 시도해주세요."
        : decodeURIComponent(err);
    } catch {
      return "인증에 실패했습니다. 다시 시도해주세요.";
    }
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("로그인 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white px-4 py-4">
          <h1 className="text-center text-lg font-bold text-zinc-900">로그인</h1>
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4">
          <div className="space-y-6 text-center">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <p className="text-lg font-semibold text-emerald-800">
                이메일을 확인해주세요
              </p>
              <p className="mt-2 text-sm text-emerald-700">
                {email}로 로그인 링크를 보냈습니다.
                <br />
                이메일의 링크를 클릭하면 로그인됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="text-sm font-medium text-indigo-600 underline"
            >
              다른 이메일로 다시 시도
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <h1 className="text-center text-lg font-bold text-zinc-900">로그인</h1>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4">
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-xl font-semibold text-zinc-900">
              이메일 OTP 로그인
            </h2>
            <p className="text-sm text-zinc-500">
              이메일 주소를 입력하면 로그인 링크가 전송됩니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <Input
              label="이메일"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "전송 중..." : "로그인 링크 받기"}
            </PrimaryButton>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">로딩 중...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
