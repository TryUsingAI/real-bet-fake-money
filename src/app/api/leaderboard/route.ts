import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'


export async function GET() {
const supa = supabaseAdmin()
const { data } = await supa.rpc('leaderboard_rpc')
return NextResponse.json(data ?? [])
}