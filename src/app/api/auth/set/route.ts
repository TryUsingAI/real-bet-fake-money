// src/app/api/auth/set/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const { code, access_token, refresh_token } = body;

  const supabase = await supabaseServer(); // ✅ await

  // Support auth code exchange (OAuth / magic link)
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.json({ ok: true });
  }

  // Support direct token set (email+password flow)
  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json({ error: "missing payload" }, { status: 400 });
}
