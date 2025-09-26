"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function Signup() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` }
});

    if (error) { setErr(error.message); setLoading(false); return; }

    // Ensure wallet row exists at $1,000 for new users
    const uid = data.user?.id;
    if (uid) {
      await supabase.from("wallets").upsert({ user_id: uid, balance_cents: 100000 }, { onConflict: "user_id" });
    }

    r.replace("/dashboard");
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-bold mb-4">Sign up</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded bg-white/5 p-2" type="email" placeholder="Email"
               value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <input className="w-full rounded bg-white/5 p-2" type="password" placeholder="Password"
               value={password} onChange={(e)=>setPassword(e.target.value)} required />
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button disabled={loading} className="rounded bg-blue-600 px-4 py-2 font-semibold">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </main>
  );
}
