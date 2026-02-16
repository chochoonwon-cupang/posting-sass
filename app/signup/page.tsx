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
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>회원가입</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
        />

        <input
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
        />

        <input
          placeholder="전화번호"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
        />

        <input
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
        />

        {error && <div style={{ color: "crimson" }}>{error}</div>}

        <button
          disabled={loading}
          type="submit"
          style={{ padding: 12, borderRadius: 8, fontWeight: 700 }}
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/login")}
          style={{ padding: 12, borderRadius: 8 }}
        >
          이미 계정이 있나요? 로그인
        </button>
      </form>
    </div>
  );
}
