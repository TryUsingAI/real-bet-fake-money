import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { event_id, market, side, price, points, stake_cents } = await req.json();

    const { data, error } = await supabase.rpc("place_bet_atomic", {
      p_user: user.id,
      p_event_id: event_id,
      p_market: market,
      p_side: side,
      p_price: price ?? null,
      p_points: points ?? null,
      p_stake_cents: stake_cents,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "error" }, { status: 500 });
  }
}
