"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function Login() {
  const r = useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [err,setErr]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    r.replace("/dashboard");
  };

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-bold mb-4">Log in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded bg-white/5 p-2" type="email" placeholder="Email"
               value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full rounded bg-white/5 p-2" type="password" placeholder="Password"
               value={password} onChange={e=>setPassword(e.target.value)} required />
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button disabled={loading} className="rounded bg-blue-600 px-4 py-2 font-semibold">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
