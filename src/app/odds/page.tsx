"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import BetSlip from "@/components/BetSlip";

type EventRow = {
  id: number; league: string; home_team: string; away_team: string;
  commence_time: string; status: string;
};
type OddsRow = {
  id: number; event_id: number; market: "h2h"|"spreads"|"totals";
  home_price: number|null; away_price: number|null;
  home_line: number|null;  away_line: number|null;
};

export default function OddsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [odds, setOdds] = useState<OddsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<{
    event: EventRow;
    market: "moneyline"|"spread"|"total";
    side: "home"|"away"|"over"|"under";
    line: number|null;
    odds: number;
  }|null>(null);

  useEffect(() => {
    (async () => {
      const nowMinus6h = new Date(Date.now() - 6*3600e3).toISOString();
      const [e, o] = await Promise.all([
        supabase.from("events").select("*").gte("commence_time", nowMinus6h).order("commence_time"),
        supabase.from("odds").select("*"),
      ]);
      setEvents(e.data ?? []);
      setOdds(o.data ?? []);
      setLoading(false);
    })();
  }, []);

  const byEvent = useMemo(() => {
    const m = new Map<number, { h2h?: OddsRow; spreads?: OddsRow; totals?: OddsRow }>();
    for (const r of odds) {
      const slot = m.get(r.event_id) ?? {};
      if (r.market === "h2h") slot.h2h = r;
      if (r.market === "spreads") slot.spreads = r;
      if (r.market === "totals") slot.totals = r;
      m.set(r.event_id, slot);
    }
    return m;
  }, [odds]);

  if (loading) return <main className="p-6">Loading…</main>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Odds</h1>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {events.map((ev) => {
          const pack = byEvent.get(ev.id) ?? {};
          const starts = new Date(ev.commence_time);
          const locked = ev.status !== "open" || starts <= new Date();

          // moneyline
          const mlHome = pack.h2h?.home_price ?? null;
          const mlAway = pack.h2h?.away_price ?? null;
          const mlDisabled = locked || mlHome === null || mlAway === null;

          // spreads
          const spHomeLine = pack.spreads?.home_line ?? null;
          const spHomePrice = pack.spreads?.home_price ?? null;
          const spAwayLine = pack.spreads?.away_line ?? null;
          const spAwayPrice = pack.spreads?.away_price ?? null;
          const spDisabled = locked || [spHomeLine, spHomePrice, spAwayLine, spAwayPrice].some(v => v === null);

          // totals
          const totOverLine = pack.totals?.home_line ?? null;   // store over on home_line
          const totOverPrice = pack.totals?.home_price ?? null;
          const totUnderLine = pack.totals?.away_line ?? null;  // store under on away_line
          const totUnderPrice = pack.totals?.away_price ?? null;
          const totDisabled = locked || [totOverLine, totOverPrice, totUnderLine, totUnderPrice].some(v => v === null);

          return (
            <div key={ev.id} className="rounded-2xl bg-[#0b0f1a] border border-white/10 p-5">
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-sm opacity-70">{starts.toLocaleString()}</div>
                <div className="text-xs uppercase tracking-wide opacity-60">{ev.league}</div>
              </div>

              <div className="font-medium mb-4">
                <span className="opacity-80">{ev.away_team}</span>
                <span className="opacity-50 mx-1">@</span>
                <span className="text-[#F6C700]">{ev.home_team}</span>
              </div>

              <section className="mb-4">
                <div className="text-xs uppercase opacity-60 mb-2">Moneyline</div>
                <div className="flex gap-2">
                  <Btn
                    label={`${ev.home_team} ${fmtPrice(mlHome)}`}
                    disabled={mlDisabled}
                    onClick={() => mlHome!==null && setSelection({ event: ev, market: "moneyline", side: "home", line: null, odds: mlHome })}
                  />
                  <Btn
                    label={`${ev.away_team} ${fmtPrice(mlAway)}`}
                    disabled={mlDisabled}
                    onClick={() => mlAway!==null && setSelection({ event: ev, market: "moneyline", side: "away", line: null, odds: mlAway })}
                  />
                </div>
              </section>

              <section className="mb-4">
                <div className="text-xs uppercase opacity-60 mb-2">Spread</div>
                <div className="flex gap-2">
                  <Btn
                    label={`${ev.home_team} ${fmtLine(spHomeLine)} (${fmtPrice(spHomePrice)})`}
                    disabled={spDisabled}
                    onClick={() =>
                      spHomeLine!==null && spHomePrice!==null &&
                      setSelection({ event: ev, market: "spread", side: "home", line: spHomeLine, odds: spHomePrice })
                    }
                  />
                  <Btn
                    label={`${ev.away_team} ${fmtLine(spAwayLine)} (${fmtPrice(spAwayPrice)})`}
                    disabled={spDisabled}
                    onClick={() =>
                      spAwayLine!==null && spAwayPrice!==null &&
                      setSelection({ event: ev, market: "spread", side: "away", line: spAwayLine, odds: spAwayPrice })
                    }
                  />
                </div>
              </section>

              <section>
                <div className="text-xs uppercase opacity-60 mb-2">Total</div>
                <div className="flex gap-2">
                  <Btn
                    label={`Over ${fmtLine(totOverLine)} (${fmtPrice(totOverPrice)})`}
                    disabled={totDisabled}
                    onClick={() =>
                      totOverLine!==null && totOverPrice!==null &&
                      setSelection({ event: ev, market: "total", side: "over", line: totOverLine, odds: totOverPrice })
                    }
                  />
                  <Btn
                    label={`Under ${fmtLine(totUnderLine)} (${fmtPrice(totUnderPrice)})`}
                    disabled={totDisabled}
                    onClick={() =>
                      totUnderLine!==null && totUnderPrice!==null &&
                      setSelection({ event: ev, market: "total", side: "under", line: totUnderLine, odds: totUnderPrice })
                    }
                  />
                </div>
              </section>
            </div>
          );
        })}
      </div>

      <BetSlip selection={selection} onClose={() => setSelection(null)} />
    </main>
  );
}

function Btn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm border ${disabled ? "border-white/10 text-white/30" : "border-white/20 hover:bg-white/10"}`}
    >
      {label}
    </button>
  );
}

const fmtPrice = (p: number | null) => (p===null ? "—" : p>0 ? `+${p}` : `${p}`);
const fmtLine  = (l: number | null) => (l===null ? "—" : l>0 ? `+${l}` : `${l}`);
