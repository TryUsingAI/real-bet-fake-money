import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'


const schema = z.object({
user_id: z.string().uuid(),
event_id: z.number(),
market: z.enum(['moneyline','spread','total']),
selection: z.enum(['home','away','over','under']),
stake_cents: z.number().int().min(500).max(10000)
})


function toDecimal(american: number) {
return american > 0 ? 1 + american/100 : 1 + 100/Math.abs(american)
}


export async function POST(req: Request) {
const body = await req.json()
const input = schema.parse(body)
const supa = supabaseAdmin()


const { data: ev } = await supa.from('events').select('*').eq('id', input.event_id).single()
if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
if (new Date() >= new Date(ev.commence_time)) return NextResponse.json({ error: 'Betting closed' }, { status: 400 })


// get odds row
const market = input.market === 'moneyline' ? 'moneyline' : input.market === 'spread' ? 'spread' : 'total'
const { data: odd } = await supa.from('odds').select('*').eq('event_id', ev.id).eq('market', market).limit(1).single()
if (!odd) return NextResponse.json({ error: 'Odds unavailable' }, { status: 400 })


let odds_american: number | null = null
let line: number | null = null
if (market === 'moneyline') {
odds_american = input.selection === 'home' ? odd.home_ml : odd.away_ml
} else if (market === 'spread') {
line = Number(odd.spread_line)
odds_american = input.selection === 'home' ? odd.home_spread_american : odd.away_spread_american
} else if (market === 'total') {
line = Number(odd.total_line)
odds_american = input.selection === 'over' ? odd.over_american : odd.under_american
}
if (odds_american == null) return NextResponse.json({ error: 'Selection not priced' }, { status: 400 })


// balance check
const { data: w } = await supa.from('wallets').select('*').eq('user_id', input.user_id).single()
if (!w || w.balance_cents < input.stake_cents) return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })


// create bet + ledger atomically
const { data: bet, error } = await supa.rpc('place_bet_rpc', {
p_user_id: input.user_id,
p_event_id: input.event_id,
p_market: market,
p_selection: input.selection,
p_odds_american: odds_american,
p_line: line,
p_stake_cents: input.stake_cents
})
if (error) return NextResponse.json({ error: error.message }, { status: 400 })
return NextResponse.json(bet)
}