import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'


function canReset(last: Date, isPaid: boolean) {
const now = new Date()
const diff = now.getTime() - last.getTime()
const days = diff / (1000*60*60*24)
return isPaid ? days >= 7 : days >= 30
}


export async function POST(req: Request) {
const { user_id } = await req.json()
const supa = supabaseAdmin()
const { data: p } = await supa.from('user_profiles').select('is_paid').eq('user_id', user_id).single()
const { data: w } = await supa.from('wallets').select('*').eq('user_id', user_id).single()
if (!p || !w) return NextResponse.json({ error: 'not found' }, { status: 404 })
if (!canReset(new Date(w.last_reset_at), p.is_paid)) return NextResponse.json({ error: 'too_soon' }, { status: 400 })
await supa.from('wallets').update({ balance_cents: 100000, last_reset_at: new Date(), resets_used_month: p.is_paid ? w.resets_used_month : w.resets_used_month + 1 }).eq('user_id', user_id)
await supa.from('ledger').insert({ user_id, delta_cents: 0, reason: 'reset' })
return NextResponse.json({ ok: true })
}