"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("E-posta veya şifre hatalı.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="login-page-wrap">
      <div className="card" style={{ width: "100%", maxWidth: 380 }}>
        <div className="card-body p-8">
          <div className="text-center mb-6">
            <img src="/logo.png" alt="Dynoops" style={{ height: 28 }} />
          </div>
          <h2 className="fs-4 fw-bold mb-1">Yönetim Paneline Giriş</h2>
          <p className="text-muted fs-7 mb-6">Ekip hesabınızla giriş yapın.</p>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label fs-7 fw-semibold">E-posta</label>
              <input type="email" className="form-control form-control-solid" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ekip@dynoops.com.tr" />
            </div>
            <div className="mb-4">
              <label className="form-label fs-7 fw-semibold">Şifre</label>
              <input type="password" className="form-control form-control-solid" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <div className="text-danger fs-7 mb-4">{error}</div>}
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
