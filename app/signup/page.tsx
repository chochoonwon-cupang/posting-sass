"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) router.replace("/dashboard");
    else router.replace("/login");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">회원가입</h1>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <input
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <input
            placeholder="전화번호"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <input
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            disabled={loading}
            type="submit"
            className="rounded-xl bg-indigo-500 py-3 font-semibold text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="rounded-xl border border-white/30 bg-white/5 py-3 font-medium text-white transition-colors hover:bg-white/10"
          >
            이미 계정이 있나요? 로그인
          </button>
        </form>
      </div>
    </div>
  );
}
