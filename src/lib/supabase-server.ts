import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function supabaseServer() {
  const store = await cookies(); // ⬅️ this was the missing await

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value ?? null;
        },
        set(name: string, value: string, options?: CookieOptions) {
          store.set({ name, value, ...(options ?? {}) });
        },
        remove(name: string, options?: CookieOptions) {
          store.set({ name, value: "", ...(options ?? {}), maxAge: 0 });
        },
      },
    }
  );
}
