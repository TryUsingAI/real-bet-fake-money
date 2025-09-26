import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic' // always render with current session

export default async function DashboardPage() {
  const supabase = supabaseServer()

  // get signed-in user from cookies/session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // fetch data scoped to THIS user (RLS still protects in DB)
  const [{ data: wallet }, { data: bets }] = await Promise.all([
    supabase.from('wallets').select('balance_cents').eq('user_id', user.id).maybeSingle(),
    supabase.from('v_user_bets').select('*').order('placed_at', { ascending: false }).limit(20)
  ])

  const balance = wallet?.balance_cents ?? 0

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-white/70">Wallet balance</div>
          <div className="text-4xl font-extrabold mt-2">
            ${(balance / 100).toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-white/70">Leaderboard</div>
          <div className="mt-2 text-white/50">Coming soon</div>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5">
        <div className="px-6 py-4 text-lg font-semibold">Recent bets</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-white/70 border-t border-white/10">
              <tr>
                <th className="px-6 py-3 text-left">Game</th>
                <th className="px-6 py-3 text-left">Market</th>
                <th className="px-6 py-3 text-left">Pick</th>
                <th className="px-6 py-3 text-left">Odds</th>
                <th className="px-6 py-3 text-left">Line</th>
                <th className="px-6 py-3 text-left">Stake</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Payout</th>
                <th className="px-6 py-3 text-left">Placed</th>
              </tr>
            </thead>
            <tbody>
              {(bets ?? []).map((b: any) => (
                <tr key={b.id} className="border-t border-white/10">
                  <td className="px-6 py-3">
                    {b.home_team} <span className="text-white/60">@</span> {b.away_team}
                  </td>
                  <td className="px-6 py-3">{b.market}</td>
                  <td className="px-6 py-3">{b.selection}</td>
                  <td className="px-6 py-3">{b.odds_american}</td>
                  <td className="px-6 py-3">{b.line ?? '—'}</td>
                  <td className="px-6 py-3">${(b.stake_cents / 100).toFixed(2)}</td>
                  <td className="px-6 py-3">{b.status}</td>
                  <td className="px-6 py-3">
                    {b.payout_cents ? `$${(b.payout_cents / 100).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-6 py-3">
                    {b.placed_at ? new Date(b.placed_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {(!bets || bets.length === 0) && (
                <tr className="border-t border-white/10">
                  <td className="px-6 py-6 text-white/60" colSpan={9}>No bets yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
