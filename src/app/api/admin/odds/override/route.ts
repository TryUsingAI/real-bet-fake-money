import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'


const schema = z.object({
event_id: z.number(),
market: z.enum(['moneyline','spread','total']),
 fields: z.record(
    z.string(),
    z.union([z.number(), z.string(), z.boolean(), z.null()])
  )
});

export async function POST(req: Request) {
const auth = req.headers.get('authorization')
if (auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
const body = schema.parse(await req.json())
const supa = supabaseAdmin()
const update = { ...body.fields, is_overridden: true }
await supa.from('odds').update(update).eq('event_id', body.event_id).eq('market', body.market)
return NextResponse.json({ ok: true })
}