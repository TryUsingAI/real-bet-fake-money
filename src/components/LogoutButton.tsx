"use client";
import { supabase } from "@/lib/supabase-browser";
export default function LogoutButton() {
  return (
    <button
      className="text-sm underline"
      onClick={async()=>{ await supabase.auth.signOut(); location.href="/"; }}>
      Log out
    </button>
  );
}
