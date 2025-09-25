// src/app/api/odds/pull/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const SPORT_MAP: Record<string,string> = {
  americanfootball_nfl: "NFL",
  americanfootball_ncaaf: "NCAAF",
};

export async function GET() {
  const supa = supabaseAdmin();
  const sports = process.env.ODDS_SPORTS!.split(",");

  for (const s of sports) {
    const url =
      `https://api.the-odds-api.com/v4/sports/${s}/odds` +
      `?apiKey=${process.env.ODDS_API_KEY}` +
      `&regions=${process.env.ODDS_REGION}` +
      `&markets=${process.env.ODDS_MARKETS}` +
      `&oddsFormat=american` +
      `&bookmakers=${process.env.ODDS_BOOKMAKERS}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) continue;
    const data = await res.json();

    for (const ev of data) {
      const sport = SPORT_MAP[s] ?? "NFL";
      const commence = new Date(ev.commence_time);

      // upsert event by provider id
      const { data: evRow, error: evErr } = await supa
        .from("events")
        .upsert(
          {
            event_key: ev.id,
            sport,
            league: sport,
            home_team: ev.home_team,
            away_team: ev.away_team,
            commence_time: commence,
            status: "scheduled",
          },
          { onConflict: "event_key" }
        )
        .select()
        .single();
      if (evErr || !evRow) continue;
      const eventId = evRow.id as number;

      for (const bm of ev.bookmakers ?? []) {
        const bookmaker = bm.key || "theoddsapi";

        // MONEYLINE
        const h2h = bm.markets?.find((m: any) => m.key === "h2h");
        if (h2h) {
          let home_ml: number | null = null;
          let away_ml: number | null = null;
          for (const o of h2h.outcomes || []) {
            if (o.name === ev.home_team) home_ml = o.price;
            if (o.name === ev.away_team) away_ml = o.price;
          }
          await upsertOdds(supa, {
            event_id: eventId,
            bookmaker,
            market: "moneyline",
            home_ml,
            away_ml,
          });
        }

        // SPREAD
        const spread = bm.markets?.find((m: any) => m.key === "spreads");
        if (spread) {
          let spread_line: number | null = null;
          let home_spread_american: number | null = null;
          let away_spread_american: number | null = null;
          for (const o of spread.outcomes || []) {
            spread_line = o.point;
            if (o.name === ev.home_team) home_spread_american = o.price;
            if (o.name === ev.away_team) away_spread_american = o.price;
          }
          await upsertOdds(supa, {
            event_id: eventId,
            bookmaker,
            market: "spread",
            spread_line,
            home_spread_american,
            away_spread_american,
          });
        }

        // TOTALS
        const totals = bm.markets?.find((m: any) => m.key === "totals");
        if (totals) {
          let total_line: number | null = null;
          let over_american: number | null = null;
          let under_american: number | null = null;
          for (const o of totals.outcomes || []) {
            total_line = o.point;
            if (o.name?.toLowerCase() === "over") over_american = o.price;
            if (o.name?.toLowerCase() === "under") under_american = o.price;
          }
          await upsertOdds(supa, {
            event_id: eventId,
            bookmaker,
            market: "total",
            total_line,
            over_american,
            under_american,
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

async function upsertOdds(
  supa: ReturnType<typeof supabaseAdmin>,
  row: any
) {
  // No composite unique constraint in schema, so do “select then update/insert”
  const { data: existing } = await supa
    .from("odds")
    .select("id")
    .eq("event_id", row.event_id)
    .eq("bookmaker", row.bookmaker)
    .eq("market", row.market)
    .maybeSingle();

  if (existing?.id) {
    await supa.from("odds").update({ ...row, updated_at: new Date() }).eq("id", existing.id);
  } else {
    await supa.from("odds").insert(row);
  }
}
