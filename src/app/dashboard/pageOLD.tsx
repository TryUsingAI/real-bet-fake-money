"use client";
import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { supabase } from "@/lib/supabase-browser";

type Row = {
  id: number;
  event_id: number;
  market: string;
  selection: string;
  odds_american: number;
  line: number | null;
  stake_cents: number;
  status: "open" | "won" | "lost" | "push";
  payout_cents: number | null;
  placed_at: string;
  home_team: string;
  away_team: string;
  starts_at: string;
};

export default function Dashboard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [bets, setBets] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [w, b] = await Promise.all([
        supabase.from("wallets").select("balance_cents").eq("user_id", user.id).maybeSingle(),
        supabase.from("v_user_bets").select("*").order("placed_at", { ascending: false }).limit(25),
      ]);
      setBalance(w.data?.balance_cents ?? null);
      setBets((b.data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <AuthGate>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-white/60 text-sm">Wallet balance</div>
            <div className="mt-2 text-3xl font-extrabold">
              {balance == null ? "—" : `$${(balance / 100).toFixed(2)}`}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 md:col-span-2">
            <div className="text-white/60 text-sm">Leaderboard</div>
            <div className="mt-2 text-sm text-white/70">Coming soon</div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Recent bets</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-3 py-2 text-left">Game</th>
                  <th className="px-3 py-2">Market</th>
                  <th className="px-3 py-2">Pick</th>
                  <th className="px-3 py-2">Odds</th>
                  <th className="px-3 py-2">Line</th>
                  <th className="px-3 py-2">Stake</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Payout</th>
                  <th className="px-3 py-2">Placed</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-3 py-3" colSpan={9}>Loading…</td></tr>
                ) : bets.length === 0 ? (
                  <tr><td className="px-3 py-3" colSpan={9}>No bets yet.</td></tr>
                ) : bets.map(b => (
                  <tr key={b.id} className="odd:bg-white/[0.03]">
                    <td className="px-3 py-2">
                      {b.away_team} @ <span className="text-[#F6C700]">{b.home_team}</span>
                      <div className="text-white/50 text-xs">
                        {new Date(b.starts_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">{b.market}</td>
                    <td className="px-3 py-2 text-center">{b.selection}</td>
                    <td className="px-3 py-2 text-center">{b.odds_american}</td>
                    <td className="px-3 py-2 text-center">{b.line ?? "—"}</td>
                    <td className="px-3 py-2 text-center">${(b.stake_cents / 100).toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={
                        b.status === "won" ? "text-green-400" :
                        b.status === "lost" ? "text-red-400" :
                        b.status === "push" ? "text-yellow-300" : "text-white/80"
                      }>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {b.payout_cents ? `$${(b.payout_cents / 100).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {new Date(b.placed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AuthGate>
  );
}
