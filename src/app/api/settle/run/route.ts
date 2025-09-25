// src/app/api/settle/run/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function payout(stake: number, american: number) {
  const dec = american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
  return Math.round(stake * dec);
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supa = supabaseAdmin();

  // Unsettled bets whose events are final
  const { data: bets, error } = await supa
    .from("bets")
    .select("*, events!inner(*)")
    .eq("status", "open")
    .filter("events.status", "eq", "final");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!bets?.length) return NextResponse.json({ ok: true, settled: 0, issues: [] });

  let settled = 0;
  const issues: Array<{ bet: number; step: string; err: string }> = [];

  for (const b of bets as any[]) {
    const ev = b.events;
    const hs = ev.final_home_score ?? 0;
    const as = ev.final_away_score ?? 0;

    let won = false;
    let push = false;

    if (b.market === "moneyline") {
      won = (b.selection === "home" && hs > as) || (b.selection === "away" && as > hs);
      push = hs === as;
    } else if (b.market === "spread") {
      const line = Number(b.line);
      const diff = hs - as;
      const adj = b.selection === "home" ? diff - line : -diff - line;
      won = adj > 0;
      push = adj === 0;
    } else if (b.market === "total") {
      const total = hs + as;
      const line = Number(b.line);
      won = (b.selection === "over" && total > line) || (b.selection === "under" && total < line);
      push = total === line;
    }

    let status: "won" | "lost" | "push" = "lost";
    let credit = 0;
    if (push) {
      status = "push";
      credit = b.stake_cents;
    } else if (won) {
      status = "won";
      credit = payout(b.stake_cents, b.odds_american);
    }

    const { error: upErr } = await supa
      .from("bets")
      .update({ status, payout_cents: credit })
      .eq("id", b.id);
    if (upErr) {
      issues.push({ bet: b.id, step: "update_bet", err: upErr.message });
      continue;
    }

    if (credit > 0) {
      const { error: ledErr } = await supa.from("ledger").insert({
        user_id: b.user_id,
        bet_id: b.id,
        delta_cents: credit,
        reason: status === "push" ? "bet_push_refund" : "bet_win",
      });
      if (ledErr) issues.push({ bet: b.id, step: "ledger", err: ledErr.message });

      const { data: newBal, error: incErr } = await supa.rpc("increment_wallet", {
        p_user_id: b.user_id,
        p_amount: credit,
      });
      if (incErr) issues.push({ bet: b.id, step: "increment_wallet", err: incErr.message });
      if (newBal == null) issues.push({ bet: b.id, step: "increment_wallet", err: "no balance returned" });
    }

    settled++;
  }

  return NextResponse.json({ ok: true, settled, issues });
}
