import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'


export async function POST(req: Request) {
const { user_id, username } = await req.json()
const supa = supabaseAdmin()
await supa.from('user_profiles').insert({ user_id, username }).throwOnError()
await supa.from('wallets').insert({ user_id }).throwOnError()
return NextResponse.json({ ok: true })
}