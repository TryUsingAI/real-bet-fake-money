"use client";

import { useEffect, useState } from "react";

type Market = "moneyline" | "spread" | "total";

type OpenPayload = {
  eventId: number;
  market: Market;
  side: "home" | "away" | "over" | "under";
  odds: number | null;
  line?: number | null; // spread points or total points (if applicable)
  matchup: string;      // "Home vs Away" (for display)
};

// Allow window.addEventListener("open-betslip", …) with typed detail
declare global {
  interface WindowEventMap {
    "open-betslip": CustomEvent<OpenPayload>;
  }
}

export default function BetSlip() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<OpenPayload | null>(null);
  const [stake, setStake] = useState<string>("5");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onOpen = (e: WindowEventMap["open-betslip"]) => {
      setPayload(e.detail);
      setStake("5");
      setError(null);
      setOpen(true);
    };
    window.addEventListener("open-betslip", onOpen);
    return () => window.removeEventListener("open-betslip", onOpen);
  }, []);

  async function placeBet() {
    if (!payload) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bets/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: payload.eventId,
          market: payload.market,
          side: payload.side,
          odds: payload.odds,
          line: payload.line ?? null,
          stake_cents: Math.round(Number(stake || "0") * 100),
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Bet failed (${res.status})`);
      }

      // success: close the slip
      setOpen(false);
      setPayload(null);
    } catch (err: any) {
      setError(err?.message ?? "Bet failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !payload) return null;

  const label =
    payload.market === "moneyline"
      ? `${payload.side === "home" ? "Home" : "Away"} ML ${fmtAmerican(payload.odds)}`
      : payload.market === "spread"
      ? `${payload.side === "home" ? "Home" : "Away"} ${fmtSpread(payload.line)} (${fmtAmerican(payload.odds)})`
      : // total
        `${payload.side === "over" ? "Over" : "Under"} ${fmtSpread(payload.line)} (${fmtAmerican(payload.odds)})`;

  const stakeNum = Number(stake || "0");
  const payout =
    payload.odds == null || isNaN(stakeNum)
      ? 0
      : payload.odds > 0
      ? stakeNum + (stakeNum * payload.odds) / 100
      : stakeNum + (stakeNum * 100) / Math.abs(payload.odds);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[320px] rounded-xl border border-white/10 bg-zinc-900 p-4 shadow-xl">
      <div className="flex items-start justify-between">
        <div className="font-semibold">Bet Slip</div>
        <button
          onClick={() => setOpen(false)}
          className="text-white/60 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 text-sm">
        <div className="text-white/80">{payload.matchup}</div>
        <div className="mt-1 text-white">{label}</div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <label className="text-sm text-white/70 w-16">Stake</label>
        <input
          className="flex-1 rounded bg-white/5 px-2 py-1 outline-none"
          inputMode="decimal"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          placeholder="5"
        />
        <span className="text-white/60 text-sm">USD</span>
      </div>

      <div className="mt-2 text-sm text-white/70">
        Est. payout: <span className="text-white">${payout.toFixed(2)}</span>
      </div>

      {error && <div className="mt-2 text-sm text-red-400">{error}</div>}

      <button
        onClick={placeBet}
        disabled={submitting}
        className="mt-4 w-full rounded bg-blue-600 py-2 font-semibold disabled:opacity-60"
      >
        {submitting ? "Placing…" : "Place Bet"}
      </button>
    </div>
  );
}

function fmtAmerican(n: number | null | undefined) {
  if (n == null) return "—";
  return n >= 0 ? `+${n}` : `${n}`;
}
function fmtSpread(n: number | null | undefined) {
  if (n == null) return "—";
  return n > 0 ? `+${n}` : `${n}`;
}
