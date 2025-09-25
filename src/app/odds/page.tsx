'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';

type EventRow = {
  id: number;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  status: string;
};

type OddsRow = {
  id: number;
  event_id: number;
  market: 'h2h' | 'spreads' | 'totals';
  home_price: number | null;
  away_price: number | null;
  home_line: number | null;
  away_line: number | null;
};

export default function OddsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [odds, setOdds] = useState<OddsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [e, o] = await Promise.all([
          supabase
            .from('events')
            .select('*')
            .gte('commence_time', new Date(Date.now() - 6 * 3600e3).toISOString())
            .order('commence_time'),
          supabase.from('odds').select('*'),
        ]);
        if (e.error) throw e.error;
        if (o.error) throw o.error;
        setEvents(e.data ?? []);
        setOdds(o.data ?? []);
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load odds');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const byEvent = useMemo(() => {
    const m = new Map<number, { h2h?: OddsRow; spreads?: OddsRow; totals?: OddsRow }>();
    for (const r of odds) {
      const slot = m.get(r.event_id) ?? {};
      if (r.market === 'h2h') slot.h2h = r;
      if (r.market === 'spreads') slot.spreads = r;
      if (r.market === 'totals') slot.totals = r;
      m.set(r.event_id, slot);
    }
    return m;
  }, [odds]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Odds</h1>

      {loading && <div className="opacity-70">Loading…</div>}
      {err && <div className="text-red-400">{err}</div>}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {events.map((ev) => {
          const pack = byEvent.get(ev.id) ?? {};
          const starts = new Date(ev.commence_time);
          const locked = ev.status !== 'open' || starts <= new Date();

          // Moneyline
          const mlHome = pack.h2h?.home_price ?? null;
          const mlAway = pack.h2h?.away_price ?? null;
          const mlDisabled = locked || mlHome === null || mlAway === null;

          // Spreads
          const spHomeLine = pack.spreads?.home_line ?? null;
          const spHomePrice = pack.spreads?.home_price ?? null;
          const spAwayLine = pack.spreads?.away_line ?? null;
          const spAwayPrice = pack.spreads?.away_price ?? null;
          const spDisabled =
            locked ||
            spHomeLine === null ||
            spAwayLine === null ||
            spHomePrice === null ||
            spAwayPrice === null;

          // Totals
          const totLineOver = pack.totals?.home_line ?? null; // store over on home_line
          const totOverPrice = pack.totals?.home_price ?? null;
          const totLineUnder = pack.totals?.away_line ?? null; // store under on away_line
          const totUnderPrice = pack.totals?.away_price ?? null;
          const totDisabled =
            locked ||
            totLineOver === null ||
            totLineUnder === null ||
            totOverPrice === null ||
            totUnderPrice === null;

          return (
            <div key={ev.id} className="rounded-2xl bg-[#0b0f1a] border border-white/10 p-5">
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-sm opacity-70">{starts.toLocaleString()}</div>
                <div className="text-xs uppercase tracking-wide opacity-60">{ev.league}</div>
              </div>

              <div className="font-medium mb-4">
                <span className="opacity-80">{ev.away_team}</span>
                <span className="opacity-50 mx-1">@</span>
                <span className="opacity-100 text-[#F6C700]">{ev.home_team}</span>
              </div>

              {/* Moneyline */}
              <section className="mb-4">
                <div className="text-xs uppercase opacity-60 mb-2">Moneyline</div>
                <div className="flex gap-2">
                  <InlineBtn
                    label={`${ev.home_team} ${fmtPrice(mlHome)}`}
                    disabled={mlDisabled}
                    onClick={() => {
                      if (mlHome === null) return;
                      openSlip({
                        event_id: ev.id,
                        event: ev,
                        market: 'moneyline',
                        side: 'home',
                        line: null,
                        odds: mlHome,
                      });
                    }}
                  />
                  <InlineBtn
                    label={`${ev.away_team} ${fmtPrice(mlAway)}`}
                    disabled={mlDisabled}
                    onClick={() => {
                      if (mlAway === null) return;
                      openSlip({
                        event_id: ev.id,
                        event: ev,
                        market: 'moneyline',
                        side: 'away',
                        line: null,
                        odds: mlAway,
                      });
                    }}
                  />
                </div>
              </section>

              {/* Spread */}
              <section className="mb-4">
                <div className="text-xs uppercase opacity-60 mb-2">Spread</div>
                <div className="flex gap-2">
                  <InlineBtn
                    label={`${ev.home_team} ${fmtLine(spHomeLine)} (${fmtPrice(spHomePrice)})`}
                    disabled={spDisabled}
                    onClick={() => {
                      if (spHomeLine === null || spHomePrice === null) return;
                      openSlip({
                        event_id: ev.id,
                        event: ev,
                        market: 'spread',
                        side: 'home',
                        line: spHomeLine,
                        odds: spHomePrice,
                      });
                    }}
                  />
                  <InlineBtn
                    label={`${ev.away_team} ${fmtLine(spAwayLine)} (${fmtPrice(spAwayPrice)})`}
                    disabled={spDisabled}
                    onClick={() => {
                      if (spAwayLine === null || spAwayPrice === null) return;
                      openSlip({
                        event_id: ev.id,
                        event: ev,
                        market: 'spread',
                        side: 'away',
                        line: spAwayLine,
                        odds: spAwayPrice,
                      });
                    }}
                  />
                </div>
              </section>

              {/* Total */}
              <section>
                <div className="text-xs uppercase opacity-60 mb-2">Total</div>
                <div className="flex gap-2">
                  <InlineBtn
                    label={`Over ${fmtLine(totLineOver)} (${fmtPrice(totOverPrice)})`}
                    disabled={totDisabled}
                    onClick={() => {
                      if (totLineOver === null || totOverPrice === null) return;
                      openSlip({
                        event_id: ev.id,
                        event: ev,
                        market: 'total',
                        side: 'over',
                        line: totLineOver,
                        odds: totOverPrice,
                      });
                    }}
                  />
                  <InlineBtn
                    label={`Under ${fmtLine(totLineUnder)} (${fmtPrice(totUnderPrice)})`}
                    disabled={totDisabled}
                    onClick={() => {
                      if (totLineUnder === null || totUnderPrice === null) return;
                      openSlip({
                        event_id: ev.id,
                        event: ev,
                        market: 'total',
                        side: 'under',
                        line: totLineUnder,
                        odds: totUnderPrice,
                      });
                    }}
                  />
                </div>
              </section>
            </div>
          );
        })}
      </div>
    </main>
  );
}

// Inline button to avoid missing import
function InlineBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm border ${
        disabled ? 'border-white/10 text-white/30' : 'border-white/20 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );
}

// Stub for opening a slip. Wire to your BetSlip when ready.
function openSlip(payload: any) {
  // TODO: integrate with BetSlip component or a global store.
  // For now just log so the page compiles and deploys.
  console.log('open slip', payload);
}

function fmtPrice(p: number | null) {
  if (p === null) return '—';
  return p > 0 ? `+${p}` : `${p}`;
}
function fmtLine(l: number | null) {
  if (l === null) return '—';
  return l > 0 ? `+${l}` : `${l}`;
}
