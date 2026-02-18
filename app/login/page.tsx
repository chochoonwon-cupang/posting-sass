"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/dashboard");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">로그인</h1>

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
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
