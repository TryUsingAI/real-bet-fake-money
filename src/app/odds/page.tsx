'use client';

import { useEffect, useState } from 'react';
import OddsBtn from '@/components/OddsBtn';

// ---- Helpers (kept local to avoid extra imports) ----
function fmtPrice(v: number | null | undefined) {
  if (v === null || v === undefined) return '—';
  return v > 0 ? `+${v}` : `${v}`;
}
function fmtTime(ts?: string | null) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Types are intentionally loose (any) so the page compiles
// regardless of the exact DB shape. All reads are guarded.
type EventRow = any;

// ------------------------------------------------------------------
// NOTE: Keep whatever fetch you already had. If you were already
// loading `rows` from Supabase, replace the useEffect below with your
// existing loader and setRows(data). The rest of the file is the
// important part (safe guards around pack?.h2h etc.).
// ------------------------------------------------------------------

export default function OddsPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Dummy loader placeholder — REPLACE with your existing data loader if you have one.
  useEffect(() => {
    // If you already have odds data in state on this page, delete this effect.
    // Otherwise you can fetch from your own endpoint here.
    (async () => {
      try {
        // Example: get from your existing API if present
        const res = await fetch('/api/odds/list').catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          setRows(Array.isArray(data) ? data : data.rows ?? []);
        } else {
          // If there is no endpoint, we just leave rows empty.
          setRows([]);
        }
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load odds');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Odds</h1>

      {loading && <div className="opacity-70">Loading…</div>}
      {err && <div className="text-red-400">{err}</div>}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row: any) => (
          <EventCard key={row?.id ?? row?.event_key} ev={row} />
        ))}
      </div>
    </main>
  );
}

function EventCard({ ev }: { ev: any }) {
  // Your existing code likely had something like: const pack = ev.pack or ev.odds.pack
  // We support both common shapes; everything below is guarded.
  const pack = ev?.pack ?? ev?.odds?.pack ?? {};

  const locked: boolean = Boolean(pack?.locked || ev?.locked);

  // --- Moneyline (h2h) ---
  const mlHome = pack?.h2h?.home_price ?? null;
  const mlAway = pack?.h2h?.away_price ?? null;
  const mlDisabled = locked || mlHome === null || mlAway === null;

  // --- Spread ---
  const spHomeLine = pack?.spread?.home_line ?? null;
  const spHomePrice = pack?.spread?.home_price ?? null;
  const spAwayLine = pack?.spread?.away_line ?? null;
  const spAwayPrice = pack?.spread?.away_price ?? null;
  const spDisabled =
    locked ||
    spHomeLine === null ||
    spAwayLine === null ||
    spHomePrice === null ||
    spAwayPrice === null;

  // --- Total ---
  const totalLine = pack?.total?.line ?? null;
  const overPrice = pack?.total?.over_price ?? null;
  const underPrice = pack?.total?.under_price ?? null;
  const totalDisabled =
    locked || totalLine === null || overPrice === null || underPrice === null;

  // Click handlers are guarded so they never execute with null values.
  const onPick = (payload: any) => {
    // Replace with your existing selection handler (e.g., setSelection)
    // This stub intentionally does nothing to keep the page compilable.
    console.log('pick', payload);
  };

  return (
    <div className="rounded-2xl bg-[#0b0f1a] border border-white/10 p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-sm opacity-70">{fmtTime(ev?.starts_at)}</div>
        <div className="text-xs uppercase tracking-wide opacity-60">
          {ev?.league ?? ev?.sport ?? ''}
        </div>
      </div>

      <div className="font-medium mb-4">
        <span className="opacity-80">{ev?.away_team}</span>
        <span className="opacity-50 mx-1">@</span>
        <span className="opacity-100">{ev?.home_team}</span>
      </div>

      {/* Moneyline */}
      <section className="mb-4">
        <div className="text-xs uppercase opacity-60 mb-2">Moneyline</div>
        <div className="flex gap-2">
          <OddsBtn
            label={`${ev?.home_team ?? 'Home'} ${fmtPrice(mlHome)}`}
            disabled={mlDisabled}
            onClick={() => {
              if (mlHome === null) return;
              onPick({
                event: ev,
                market: 'moneyline',
                side: 'home',
                line: null,
                odds: mlHome,
              });
            }}
          />
          <OddsBtn
            label={`${ev?.away_team ?? 'Away'} ${fmtPrice(mlAway)}`}
            disabled={mlDisabled}
            onClick={() => {
              if (mlAway === null) return;
              onPick({
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
          <OddsBtn
            label={`${ev?.home_team ?? 'Home'} ${spHomeLine ?? '—'} (${fmtPrice(
              spHomePrice
            )})`}
            disabled={spDisabled}
            onClick={() => {
              if (spHomeLine === null || spHomePrice === null) return;
              onPick({
                event: ev,
                market: 'spread',
                side: 'home',
                line: spHomeLine,
                odds: spHomePrice,
              });
            }}
          />
          <OddsBtn
            label={`${ev?.away_team ?? 'Away'} ${spAwayLine ?? '—'} (${fmtPrice(
              spAwayPrice
            )})`}
            disabled={spDisabled}
            onClick={() => {
              if (spAwayLine === null || spAwayPrice === null) return;
              onPick({
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
          <OddsBtn
            label={`Over ${totalLine ?? '—'} (${fmtPrice(overPrice)})`}
            disabled={totalDisabled}
            onClick={() => {
              if (totalLine === null || overPrice === null) return;
              onPick({
                event: ev,
                market: 'total',
                side: 'over',
                line: totalLine,
                odds: overPrice,
              });
            }}
          />
          <OddsBtn
            label={`Under ${totalLine ?? '—'} (${fmtPrice(underPrice)})`}
            disabled={totalDisabled}
            onClick={() => {
              if (totalLine === null || underPrice === null) return;
              onPick({
                event: ev,
                market: 'total',
                side: 'under',
                line: totalLine,
                odds: underPrice,
              });
            }}
          />
        </div>
      </section>
    </div>
  );
}
