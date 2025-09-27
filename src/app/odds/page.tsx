// src/app/odds/page.tsx
import Script from "next/script";
import { supabaseAdmin } from "@/lib/supabase";
import BetSlip from "@/components/BetSlip";

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
  // PostgREST may return an array OR a single object for embeds
  events:
    | { home_team: string; away_team: string; commence_time: string }
    | { home_team: string; away_team: string; commence_time: string }[];
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
  return n >= 0 ? `+${n}` : `${n}`;
}
function fmtSpread(n: number | null | undefined) {
  if (n == null) return "—";
  return n > 0 ? `+${n}` : `${n}`;
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
    .from("odds")
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
    // normalize embed: object | array -> object
    const evRaw = r.events as DbRow["events"];
    const ev =
      Array.isArray(evRaw) ? evRaw[0] : evRaw; // robust to either shape

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

    if (r.home_ml != null) base.home_ml ??= r.home_ml;
    if (r.away_ml != null) base.away_ml ??= r.away_ml;

    if (r.spread_line != null) {
      base.home_spread_points ??= r.spread_line;
      base.away_spread_points ??= -r.spread_line;
    }
    if (r.home_spread_american != null)
      base.home_spread_american ??= r.home_spread_american;
    if (r.away_spread_american != null)
      base.away_spread_american ??= r.away_spread_american;

    if (r.total_line != null) base.total_points ??= r.total_line;
    if (r.over_american != null) base.over_price ??= r.over_american;
    if (r.under_american != null) base.under_price ??= r.under_american;

    byEvent.set(r.event_id, base);
  }

  const rows = Array.from(byEvent.values());

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Odds</h1>

      {/* Bridge: decode payload and raise "open-bet" for BetSlip */}
      <Script id="bet-open-bridge">{`
        (function () {
          if (window.__betBridgeInstalled) return;
          window.__betBridgeInstalled = true;
          document.addEventListener('click', function (e) {
            const t = e.target;
            if (!(t instanceof HTMLElement)) return;
            const el = t.closest('[data-bet]');
            if (!el) return;
            try {
              const raw = el.getAttribute('data-bet');
              if (!raw) return;
              const payload = JSON.parse(decodeURIComponent(raw));
              window.dispatchEvent(new CustomEvent('open-bet', { detail: payload }));
            } catch {}
          }, true);
        })();
      `}</Script>

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
                  : `${fmtSpread(r.home_spread_points)} (${fmtAmerican(r.home_spread_american)})`;
              const awaySpread =
                r.away_spread_points == null && r.away_spread_american == null
                  ? "—"
                  : `${fmtSpread(r.away_spread_points)} (${fmtAmerican(r.away_spread_american)})`;

              const start = r.commence_time
                ? new Date(r.commence_time).toLocaleString(undefined, {
                    month: "short",
                    day: "2-digit",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "";

              const base = {
                event_id: r.event_id,
                home_team: r.home_team,
                away_team: r.away_team,
                commence_time: r.commence_time,
              };

              const betMlHome = encodeURIComponent(
                JSON.stringify({ ...base, market: "moneyline", side: "home", price: r.home_ml })
              );
              const betMlAway = encodeURIComponent(
                JSON.stringify({ ...base, market: "moneyline", side: "away", price: r.away_ml })
              );
              const betSprHome = encodeURIComponent(
                JSON.stringify({
                  ...base,
                  market: "spread",
                  side: "home",
                  points: r.home_spread_points,
                  price: r.home_spread_american,
                })
              );
              const betSprAway = encodeURIComponent(
                JSON.stringify({
                  ...base,
                  market: "spread",
                  side: "away",
                  points: r.away_spread_points,
                  price: r.away_spread_american,
                })
              );
              const betOver = encodeURIComponent(
                JSON.stringify({
                  ...base,
                  market: "total",
                  side: "over",
                  points: r.total_points,
                  price: r.over_price,
                })
              );
              const betUnder = encodeURIComponent(
                JSON.stringify({
                  ...base,
                  market: "total",
                  side: "under",
                  points: r.total_points,
                  price: r.under_price,
                })
              );

              return (
                <tr key={r.event_id} className="border-t border-white/10">
                  <td className="px-4 py-4">
                    <div className="font-medium">
                      {r.home_team} vs {r.away_team}
                    </div>
                    <div className="text-white/60 text-xs">{start}</div>
                  </td>

                  {/* ML */}
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className="rounded px-2 py-1 hover:bg-white/5"
                      data-bet={betMlHome}
                      disabled={r.home_ml == null}
                    >
                      {fmtAmerican(r.home_ml)}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className="rounded px-2 py-1 hover:bg-white/5"
                      data-bet={betMlAway}
                      disabled={r.away_ml == null}
                    >
                      {fmtAmerican(r.away_ml)}
                    </button>
                  </td>

                  {/* Spreads */}
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className="rounded px-2 py-1 hover:bg-white/5"
                      data-bet={betSprHome}
                      disabled={
                        r.home_spread_points == null && r.home_spread_american == null
                      }
                    >
                      {homeSpread}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className="rounded px-2 py-1 hover:bg-white/5"
                      data-bet={betSprAway}
                      disabled={
                        r.away_spread_points == null && r.away_spread_american == null
                      }
                    >
                      {awaySpread}
                    </button>
                  </td>

                  {/* Totals */}
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded px-2 py-1 hover:bg-white/5"
                        data-bet={betOver}
                        disabled={r.total_points == null && r.over_price == null}
                      >
                        {r.total_points == null
                          ? "—"
                          : `O ${r.total_points} (${fmtAmerican(r.over_price)})`}
                      </button>
                      <button
                        type="button"
                        className="rounded px-2 py-1 hover:bg-white/5"
                        data-bet={betUnder}
                        disabled={r.total_points == null && r.under_price == null}
                      >
                        {r.total_points == null
                          ? "—"
                          : `U ${r.total_points} (${fmtAmerican(r.under_price)})`}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-white/60 text-center" colSpan={6}>
                  No odds available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mount the client bet slip once */}
      <BetSlip />
    </main>
  );
}
