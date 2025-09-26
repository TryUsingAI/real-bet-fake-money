import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  const cookieStore = await cookies(); // 👈 async now

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? null;
        },
        set(name: string, value: string, options?: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options?: any) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  // Touch auth to ensure cookies are written (no-op read)
  await supabase.auth.getUser();

  return NextResponse.json({ ok: true });
}
