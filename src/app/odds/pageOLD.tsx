// src/app/odds/page.tsx
import { supabaseAdmin } from "@/lib/supabase";

type DbRow = {
  event_id: number;
  home_ml: number | null;
  away_ml: number | null;
  spread_line: number | null;
  home_spread_american: number | null;
  away_spread_american: number | null;
  total_line: number | null;
  over_american: number | null;
  under_american: number | null;
  events: { home_team: string; away_team: string; commence_time: string } | null;
};

type Merged = {
  event_id: number;
  home_team: string;
  away_team: string;
  commence_time: string | null;

  home_ml: number | null;
  away_ml: number | null;

  home_spread_points: number | null;
  home_spread_american: number | null;
  away_spread_points: number | null;
  away_spread_american: number | null;

  total_points: number | null;
  over_price: number | null;
  under_price: number | null;
};

function fmtAmerican(n: number | null | undefined) {
  if (n == null) return "—";
  const s = n >= 0 ? `+${n}` : `${n}`;
  return s;
}
function fmtSpread(n: number | null | undefined) {
  if (n == null) return "—";
  // show + for positive, keep .5 if present
  const s = n > 0 ? `+${n}` : `${n}`;
  return s;
}
function fmtTotalRow(total: number | null, over: number | null, under: number | null) {
  if (total == null) return "—";
  return (
    <>
      <div>{`O ${total} (${fmtAmerican(over)})`}</div>
      <div>{`U ${total} (${fmtAmerican(under)})`}</div>
    </>
  );
}

export default async function OddsPage() {
  const supabase = supabaseAdmin();

const { data, error } = await supabase
  .from('odds')
  .select(`
    event_id,
    home_ml, away_ml, spread_line, home_spread_american, away_spread_american,
    total_line, over_american, under_american,
    events:events!inner(home_team, away_team, commence_time)
  `)
  .returns<DbRow[]>();

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-6">Odds</h1>
        <div className="text-red-400">{error.message}</div>
      </main>
    );
  }

  const byEvent = new Map<number, Merged>();

 for (const r of data ?? []) {
  const ev = r.events; // <— not r.events?.[0]
  const base: Merged =
    byEvent.get(r.event_id) ?? {
      event_id: r.event_id,
      home_team: ev?.home_team ?? "",
      away_team: ev?.away_team ?? "",
      commence_time: ev?.commence_time ?? null,
      home_ml: null,
      away_ml: null,
      home_spread_points: null,
      home_spread_american: null,
      away_spread_points: null,
      away_spread_american: null,
      total_points: null,
      over_price: null,
      under_price: null,
    };


    // Moneyline
    if (r.home_ml != null) base.home_ml ??= r.home_ml;
    if (r.away_ml != null) base.away_ml ??= r.away_ml;

    // Spread: one line is from home POV; away is the negative
    if (r.spread_line != null) {
      base.home_spread_points ??= r.spread_line;
      base.away_spread_points ??= -r.spread_line;
    }
    if (r.home_spread_american != null)
      base.home_spread_american ??= r.home_spread_american;
    if (r.away_spread_american != null)
      base.away_spread_american ??= r.away_spread_american;

    // Totals
    if (r.total_line != null) base.total_points ??= r.total_line;
    if (r.over_american != null) base.over_price ??= r.over_american;
    if (r.under_american != null) base.under_price ??= r.under_american;

    byEvent.set(r.event_id, base);
  }

  const rows = Array.from(byEvent.values());

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Odds</h1>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-left text-white/80">
            <tr>
              <th className="px-4 py-3 w-[36%]">Game / Time</th>
              <th className="px-4 py-3">Home ML</th>
              <th className="px-4 py-3">Away ML</th>
              <th className="px-4 py-3">Home Spread</th>
              <th className="px-4 py-3">Away Spread</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const homeSpread =
                r.home_spread_points == null && r.home_spread_american == null
                  ? "—"
                  : `${fmtSpread(r.home_spread_points)} (${fmtAmerican(
                      r.home_spread_american
                    )})`;
              const awaySpread =
                r.away_spread_points == null && r.away_spread_american == null
                  ? "—"
                  : `${fmtSpread(r.away_spread_points)} (${fmtAmerican(
                      r.away_spread_american
                    )})`;

              const start =
                r.commence_time
                  ? new Date(r.commence_time)
                      .toLocaleString(undefined, {
                        month: "short",
                        day: "2-digit",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                  : "";

              return (
                <tr key={r.event_id} className="border-t border-white/10">
                  <td className="px-4 py-4">
                    <div className="font-medium">
                      {r.home_team} vs {r.away_team}
                    </div>
                    <div className="text-white/60 text-xs">{start}</div>
                  </td>
                  <td className="px-4 py-4">{fmtAmerican(r.home_ml)}</td>
                  <td className="px-4 py-4">{fmtAmerican(r.away_ml)}</td>
                  <td className="px-4 py-4">{homeSpread}</td>
                  <td className="px-4 py-4">{awaySpread}</td>
                  <td className="px-4 py-4">
                    {fmtTotalRow(r.total_points, r.over_price, r.under_price)}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-white/60 text-center"
                  colSpan={6}
                >
                  No odds available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
