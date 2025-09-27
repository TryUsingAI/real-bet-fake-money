// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";

type DbBetRow = {
  id: string;
  user_id: string;
  event_id: number;
  market: "ml" | "spread" | "total_over" | "total_under" | string;
  selection: "home" | "away" | "over" | "under" | string;
  odds_american: number | null;
  line: number | null;
  stake_cents: number | null;
  status: "pending" | "won" | "lost" | "push" | string;
  payout_cents: number | null;
  placed_at: string;
  events:
    | { home_team: string; away_team: string; commence_time: string }
    | { home_team: string; away_team: string; commence_time: string }[];
};

function fmtAmerican(n: number | null | undefined) {
  if (n == null) return "—";
  return n >= 0 ? `+${n}` : `${n}`;
}
function fmtSpread(n: number | null | undefined) {
  if (n == null) return "—";
  return n > 0 ? `+${n}` : `${n}`;
}

export default async function DashboardPage() {
  const supabase = await supabaseServer();

  // current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // wallet + bets
  const [{ data: wallet }, { data: bets }] = await Promise.all([
    supabase
      .from("wallets")
      .select("balance_cents")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("bets")
      .select(
        `id,user_id,event_id,market,selection,odds_american,line,stake_cents,status,payout_cents,placed_at,
         events:events(home_team,away_team,commence_time)`
      )
      .eq("user_id", user.id)
      .order("placed_at", { ascending: false })
      .returns<DbBetRow[]>(),
  ]);

  const balance =
    wallet && typeof wallet.balance_cents === "number"
      ? (wallet.balance_cents / 100).toFixed(2)
      : "0.00";

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Wallet */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold">Wallet</h2>
        <p className="text-lg">Balance: ${balance}</p>
      </section>

      {/* Bets */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Your Bets</h2>

        {!bets || bets.length === 0 ? (
          <p className="text-white/60">No bets placed yet.</p>
        ) : (
          <ul className="space-y-3">
            {bets.map((b) => {
              // normalize embed (array | object) -> object
              const evRaw = b.events;
              const ev = Array.isArray(evRaw) ? evRaw[0] : evRaw;
              const vs = ev
                ? `${ev.home_team} vs ${ev.away_team}`
                : `Event ${b.event_id}`;
              const start = ev?.commence_time
                ? new Date(ev.commence_time).toLocaleString(undefined, {
                    month: "short",
                    day: "2-digit",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "";

              // render selection/price/line nicely
              let lineText = "";
              if (b.market === "ml") {
                const team = b.selection === "home" ? "HOME" : "AWAY";
                lineText = `${team} ML (${fmtAmerican(b.odds_american)})`;
              } else if (b.market === "spread") {
                const team = b.selection === "home" ? "HOME" : "AWAY";
                lineText = `${team} ${fmtSpread(b.line)} (${fmtAmerican(
                  b.odds_american
                )})`;
              } else if (b.market === "total_over") {
                lineText = `OVER ${b.line ?? "—"} (${fmtAmerican(
                  b.odds_american
                )})`;
              } else if (b.market === "total_under") {
                lineText = `UNDER ${b.line ?? "—"} (${fmtAmerican(
                  b.odds_american
                )})`;
              } else {
                lineText = `${b.market} ${b.selection}`;
              }

              const stake =
                typeof b.stake_cents === "number"
                  ? (b.stake_cents / 100).toFixed(2)
                  : "0.00";

              const statusColor =
                b.status === "won"
                  ? "bg-green-600"
                  : b.status === "lost"
                  ? "bg-red-600"
                  : b.status === "push"
                  ? "bg-gray-600"
                  : "bg-blue-600"; // pending/default

              return (
                <li
                  key={b.id}
                  className="border border-white/10 rounded-lg p-4 bg-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{vs}</div>
                      <div className="text-white/60 text-sm">{start}</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-white/70">
                        Stake: ${stake}
                      </div>
                      <div
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${statusColor}`}
                      >
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-white/90">{lineText}</div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
