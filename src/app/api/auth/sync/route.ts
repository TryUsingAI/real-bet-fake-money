import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json();

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
    }

  const supabase = await supabaseServer();
  await supabase.auth.setSession({ access_token, refresh_token });

  return new NextResponse(null, { status: 204 });
}
