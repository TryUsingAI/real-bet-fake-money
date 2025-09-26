import { supabaseServer } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await supabaseServer()

  // Get the current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    // If no user, go back to login
    redirect("/login")
  }

  // Fetch wallet and bets in parallel
  const [{ data: wallet }, { data: bets }] = await Promise.all([
    supabase
      .from("wallets")
      .select("balance_cents")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("v_user_bets")
      .select("*")
      .eq("user_id", user.id)
      .order("placed_at", { ascending: false })
      .limit(20),
  ])

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Wallet Balance */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold">Wallet</h2>
        <p className="text-lg">
          Balance:{" "}
          {wallet
            ? `$${(wallet.balance_cents / 100).toFixed(2)}`
            : "No wallet found"}
        </p>
      </section>

      {/* Recent Bets */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Recent Bets</h2>
        {!bets || bets.length === 0 ? (
          <p className="text-gray-400">No bets placed yet.</p>
        ) : (
          <ul className="space-y-2">
            {bets.map((bet) => (
              <li
                key={bet.id}
                className="border rounded p-3 bg-white/5 flex justify-between"
              >
                <span>
                  {bet.game} — {bet.pick}
                </span>
                <span className="font-semibold">
                  Wager: ${(bet.amount_cents / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
