"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import BetSlip from "@/components/BetSlip";

type Odd = {
  id: number; event_id: number; bookmaker: string; market: "h2h"|"spreads"|"totals";
  home_price: number|null; away_price: number|null;
  home_line: number|null;  away_line: number|null;
};
type Event = {
  id: number; sport: string; league: string;
  home_team: string; away_team: string;
  commence_time: string; status: string;
};

export default function OddsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [odds, setOdds] = useState<Odd[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<{
    event?: Event; market?: "moneyline"|"spread"|"total";
    side?: "home"|"away"|"over"|"under"; line?: number|null; odds?: number;
  }>();

  useEffect(() => {
    (async () => {
      const [e, o] = await Promise.all([
        supabase.from("events").select("*").gte("commence_time", new Date(Date.now()-6*3600e3).toISOString()).order("commence_time"),
        supabase.from("odds").select("*"),
      ]);
      setEvents(e.data ?? []);
      setOdds(o.data ?? []);
      setLoading(false);
    })();
  }, []);

  const byEvent = useMemo(() => {
    const m = new Map<number, {h2h?: Odd, spreads?: Odd, totals?: Odd}>();
    for (const r of odds) {
      const slot = m.get(r.event_id) ?? {};
      slot[r.market] = r;
      m.set(r.event_id, slot);
    }
    return m;
  }, [odds]);

  if (loading) return <main className="p-6">Loading…</main>;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold mb-4">Odds</h1>
      <div className="grid gap-4">
        {events.map(ev => {
          const pack = byEvent.get(ev.id);
          const starts = new Date(ev.commence_time);
          const locked = ev.status !== "open" || starts <= new Date();
          return (
            <div key={ev.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/60">{starts.toLocaleString()}</div>
                  <div className="text-lg"><span className="text-white/80">{ev.away_team}</span> @ <span className="text-[#F6C700]">{ev.home_team}</span></div>
                </div>
                {locked && <div className="text-white/50 text-xs">Locked</div>}
              </div>

              {/* Moneyline */}
              {pack?.h2h && (
                <div className="mt-3 flex gap-3">
                  <OddsBtn
                    label={`${ev.home_team} ${fmtPrice(pack.h2h.home_price)}`}
                    disabled={locked || pack.h2h.home_price==null}
                    onClick={() => setSelection({event:ev, market:"moneyline", side:"home", line:null, odds:pack.h2h.home_price!})}
                  />
                  <OddsBtn
                    label={`${ev.away_team} ${fmtPrice(pack.h2h.away_price)}`}
                    disabled={locked || pack.h2h.away_price==null}
                    onClick={() => setSelection({event:ev, market:"moneyline", side:"away", line:null, odds:pack.h2h.away_price!})}
                  />
                </div>
              )}

              {/* Spread */}
              {pack?.spreads && (
                <div className="mt-2 flex gap-3">
                  <OddsBtn
                    label={`${ev.home_team} ${lineStr(pack.spreads.home_line)} (${vigStr(pack.spreads.home_price)})`}
                    disabled={locked || pack.spreads.home_price==null || pack.spreads.home_line==null}
                    onClick={() => setSelection({event:ev, market:"spread", side:"home", line:Number(pack.spreads.home_line), odds:pack.spreads.home_price!})}
                  />
                  <OddsBtn
                    label={`${ev.away_team} ${lineStr(pack.spreads.away_line)} (${vigStr(pack.spreads.away_price)})`}
                    disabled={locked || pack.spreads.away_price==null || pack.spreads.away_line==null}
                    onClick={() => setSelection({event:ev, market:"spread", side:"away", line:Number(pack.spreads.away_line), odds:pack.spreads.away_price!})}
                  />
                </div>
              )}

              {/* Total */}
              {pack?.totals && (
                <div className="mt-2 flex gap-3">
                  <OddsBtn
                    label={`Over ${pack.totals.home_line ?? "—"} (${vigStr(pack.totals.home_price)})`}
                    disabled={locked || pack.totals.home_price==null || pack.totals.home_line==null}
                    onClick={() => setSelection({event:ev, market:"total", side:"over", line:Number(pack.totals.home_line), odds:pack.totals.home_price!})}
                  />
                  <OddsBtn
                    label={`Under ${pack.totals.away_line ?? "—"} (${vigStr(pack.totals.away_price)})`}
                    disabled={locked || pack.totals.away_price==null || pack.totals.away_line==null}
                    onClick={() => setSelection({event:ev, market:"total", side:"under", line:Number(pack.totals.away_line), odds:pack.totals.away_price!})}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BetSlip selection={selection} onClose={() => setSelection(undefined)} />
    </main>
  );
}

function OddsBtn({label, onClick, disabled}:{label:string; onClick:()=>void; disabled?:boolean}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm border ${disabled?"border-white/10 text-white/30":"border-white/20 hover:bg-white/10"}`}>
      {label}
    </button>
  );
}
const fmtPrice = (p:number|null)=> p==null?"—":(p>0?`+${p}`:`${p}`);
const vigStr = (p:number|null)=> p==null?"—":(p>0?`+${p}`:`${p}`);
const lineStr = (l:number|null)=> l==null?"—":(l>0?`+${l}`:`${l}`);
