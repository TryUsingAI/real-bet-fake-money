import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: cookieStore.get, set: cookieStore.set, remove: cookieStore.set } }
  )
  if (code) await supabase.auth.exchangeCodeForSession(code)
  return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_SITE_URL))
}
