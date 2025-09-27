"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BetPayload = {
  market: "ml" | "spread" | "total_over" | "total_under";
  side: "home" | "away" | "over" | "under";
  eventId: number;
  odds: number | null;
  line: number | null;
  homeTeam: string;
  awayTeam: string;
};
type OpenEvt = CustomEvent<BetPayload>;
const EVT = "bet:open";

export function openBet(payload: BetPayload) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: payload }));
}

export default function BetSlip() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bet, setBet] = useState<BetPayload | null>(null);
  const [wager, setWager] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as OpenEvt;
      setBet(ce.detail);
      setWager("");
      setMessage(null);
      setOpen(true);
    };
    window.addEventListener(EVT, handler as EventListener);
    return () => window.removeEventListener(EVT, handler as EventListener);
  }, []);

  const title = useMemo(() => {
    if (!bet) return "";
    const vs = `${bet.homeTeam} vs ${bet.awayTeam}`;
    if (bet.market === "ml") {
      const t = bet.side === "home" ? bet.homeTeam : bet.awayTeam;
      return `${t} ML @ ${fmtAmerican(bet.odds)}`;
    }
    if (bet.market === "spread") {
      const t = bet.side === "home" ? bet.homeTeam : bet.awayTeam;
      const line = bet.line == null ? "—" : bet.line > 0 ? `+${bet.line}` : `${bet.line}`;
      return `${t} ${line} (${fmtAmerican(bet.odds)})`;
    }
    const tag = bet.market === "total_over" ? "Over" : "Under";
    const line = bet.line ?? "—";
    return `${tag} ${line} (${fmtAmerican(bet.odds)})`;
  }, [bet]);

  const canSubmit = !!bet && wager.trim() !== "" && Number(wager) > 0 && !submitting;

  const submit = async () => {
    if (!bet) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/bets/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: bet.eventId,
          market: bet.market === "total_over" || bet.market === "total_under" ? "total" : bet.market,
          side: bet.market === "total_over" ? "over" : bet.market === "total_under" ? "under" : bet.side,
          line: bet.line,
          odds: bet.odds,
          wager_dollars: Number(wager),
        }),
      });
      if (!res.ok) {
        setMessage((await res.text()) || "Bet failed.");
        setSubmitting(false);
        return;
      }
      setMessage("Bet placed!");
      // quick visual confirmation then redirect to dashboard
      setTimeout(() => {
        setOpen(false);
        router.push("/dashboard");
        router.refresh();
      }, 700);
    } catch (err: any) {
      setMessage(err?.message ?? "Bet failed.");
      setSubmitting(false);
    }
  };

  if (!open || !bet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full sm:max-w-md rounded-2xl bg-zinc-900 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Bet Slip</h3>
          <button className="text-white/60 hover:text-white" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="text-sm text-white/80 mb-4">{title}</div>

        <label className="block text-sm text-white/70 mb-1">Wager ($)</label>
        <input
          type="number"
          min={1}
          step="1"
          className="w-full rounded bg-white/5 p-2 mb-3"
          value={wager}
          onChange={(e) => setWager(e.target.value)}
          placeholder="10"
          disabled={submitting}
        />

        {message && (
          <div className="mb-3 text-sm">
            <span className="px-2 py-1 rounded bg-white/10">{message}</span>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            onClick={submit}
            disabled={!canSubmit}
          >
            {submitting ? "Placing…" : "Place Bet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtAmerican(n: number | null | undefined) {
  if (n == null) return "—";
  return n >= 0 ? `+${n}` : `${n}`;
}
