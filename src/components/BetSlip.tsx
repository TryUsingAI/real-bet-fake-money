"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function BetSlip({
  selection, onClose,
}:{
  selection?: {
    event:{ id:number; home_team:string; away_team:string; commence_time:string };
    market:"moneyline"|"spread"|"total";
    side:"home"|"away"|"over"|"under";
    line:number|null; odds:number|undefined;
  }|undefined;
  onClose:()=>void;
}) {
  const [stake, setStake] = useState(500); // cents
  const [submitting,setSubmitting]=useState(false);
  if (!selection) return null;

  const { event, market, side, line, odds } = selection;
  const min = 500, max = 10000; // $5–$100
  const valid = stake>=min && stake<=max && !!odds;

  async function place() {
    if (!valid || !odds) return;
    setSubmitting(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }
    const body:any = {
      user_id: user.id,
      event_id: event.id,
      market,
      selection: side==="over"?"over":side==="under"?"under":side, // normalize
      stake_cents: stake,
    };
    if (market!=="moneyline") body.line = line;
    const res = await fetch("/api/bets",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
    setSubmitting(false);
    if (res.ok) onClose();
    else alert("Bet failed");
  }

  const dec = odds ? (odds>0?1+odds/100:1+100/Math.abs(odds)) : 0;
  const payout = Math.round(stake*dec)/100;

  return (
    <div className="fixed bottom-4 right-4 w-[360px] rounded-2xl border border-white/10 bg-[#0b0f1a] p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/60">Bet slip</div>
        <button className="text-white/50 text-sm" onClick={onClose}>Close</button>
      </div>
      <div className="mt-2 text-sm">
        <div className="font-semibold">{selection.side.toUpperCase()} {selection.market.toUpperCase()} {line ?? ""}</div>
        <div className="text-white/70">{selection.event.away_team} @ <span className="text-[#F6C700]">{selection.event.home_team}</span></div>
        <div className="text-white/50 text-xs">{new Date(selection.event.commence_time).toLocaleString()}</div>
        <div className="mt-2">Odds: {odds!>0?`+${odds}`:odds}</div>
      </div>

      <div className="mt-3">
        <label className="text-sm text-white/70">Stake ($5–$100)</label>
        <input
          type="number" min={min/100} max={max/100} step="1"
          value={(stake/100).toString()}
          onChange={e=>setStake(Math.round(Number(e.target.value)*100))}
          className="mt-1 w-full rounded bg-white/5 p-2"
        />
      </div>

      <div className="mt-3 text-sm text-white/70">Est. payout: <span className="font-semibold text-white">${payout.toFixed(2)}</span></div>

      <button
        disabled={!valid || submitting}
        onClick={place}
        className={`mt-3 w-full rounded-lg px-3 py-2 font-semibold ${valid?"bg-blue-600 hover:bg-blue-500":"bg-white/10 text-white/40"}`}>
        {submitting?"Placing…":"Place bet"}
      </button>
    </div>
  );
}
