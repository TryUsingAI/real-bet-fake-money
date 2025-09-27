import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const {
      event_id,
      market,          // "ml" | "spread" | "total"
      side,            // "home" | "away" | "over" | "under"
      line,            // points (nullable)
      odds,            // american odds (nullable)
      wager_dollars,   // number
    } = await req.json();

    if (!event_id || !market || !side || wager_dollars == null) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const supa = await supabaseServer();

    // who’s placing the bet?
    const {
      data: { user },
      error: uErr,
    } = await supa.auth.getUser();
    if (uErr || !user) return new NextResponse("Unauthorized", { status: 401 });

    const stake_cents = Math.round(Number(wager_dollars) * 100);

    // check wallet
    const { data: wallet, error: wErr } = await supa
      .from("wallets")
      .select("balance_cents")
      .eq("user_id", user.id)
      .single();
    if (wErr || !wallet) return new NextResponse("Wallet not found", { status: 400 });
    if (wallet.balance_cents < stake_cents)
      return new NextResponse("Insufficient balance", { status: 400 });

    // insert bet using YOUR columns
    const { data: betRow, error: bErr } = await supa
      .from("bets")
      .insert({
        user_id: user.id,
        event_id,
        market,                         // "ml" | "spread" | "total"
        selection: side,                // <- was "side"
        odds_american: odds ?? null,    // <- was "price"
        line: line ?? null,             // <- was "points"
        stake_cents,                    // <- was "wager_cents"
        status: "pending",
        placed_at: new Date().toISOString(),
        contest_id: null,
      })
      .select("id")
      .single();
    if (bErr) {
      return new NextResponse(JSON.stringify({ error: bErr.message }), {
        status: 400,
      });
    }

    // decrement wallet (simple non-atomic update for now)
    const { error: updErr } = await supa
      .from("wallets")
      .update({ balance_cents: wallet.balance_cents - stake_cents })
      .eq("user_id", user.id);
    if (updErr) {
      return new NextResponse(JSON.stringify({ error: updErr.message }), {
        status: 400,
      });
    }

    return NextResponse.json({ ok: true, bet_id: betRow.id });
  } catch (e: any) {
    return new NextResponse(JSON.stringify({ error: e?.message ?? "unknown" }), {
      status: 500,
    });
  }
}
