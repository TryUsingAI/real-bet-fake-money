import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("settle_bets");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settled: data ?? 0 });
}
