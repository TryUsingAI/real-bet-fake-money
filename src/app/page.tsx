"use client";

export default function MarketingHome() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-black tracking-tight text-lg">Real Bets Fake Money</div>
            <span className="text-[10px] uppercase tracking-wider bg-yellow-400 text-black px-2 py-1 rounded">In Beta Testing</span>
          </div>
          <nav className="flex items-center gap-3">
            <a href="/login" className="text-sm hover:underline">Log in</a>
            <a
              href="/signup"
              className="text-sm px-3 py-2 rounded-lg bg-[#0B4DA2] hover:bg-[#093f85] transition"
            >
              Start betting for free
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B4DA2]/20 via-[#E31E24]/10 to-[#F6C700]/10 pointer-events-none" />
        <div className="mx-auto max-w-6xl px-4 py-16 relative">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Real betting, no risk, compete against others
          </h1>
          <p className="mt-3 text-lg text-white/80">
            Play with real lines. No money lost. Test strategies in real time.
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href="/signup"
              className="px-5 py-3 rounded-xl bg-[#0B4DA2] hover:bg-[#093f85] font-semibold"
            >
              Start betting for free
            </a>
            <a href="#how" className="px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5">
              See how it works
            </a>
          </div>

          {/* Odds mock */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { away: "UT @", home: "OKLAHOMA", time: "Sat 2:30 PM", mlA: "+145", mlH: "-165", sprA: "+3.5 (-110)", sprH: "-3.5 (-110)", tot: "O/U 49.5 (-110)" },
              { away: "DAL @", home: "SF", time: "Sun 7:20 PM", mlA: "+120", mlH: "-140", sprA: "+2.5 (-105)", sprH: "-2.5 (-115)", tot: "O/U 45.0 (-110)" },
              { away: "LSU @", home: "A&M", time: "Sat 6:00 PM", mlA: "+102", mlH: "-118", sprA: "+1.5 (-110)", sprH: "-1.5 (-110)", tot: "O/U 52.5 (-110)" },
            ].map((g, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">{g.time}</div>
                <div className="mt-1 font-semibold">{g.away} <span className="text-[#F6C700]">{g.home}</span></div>
                <div className="mt-3 grid grid-cols-3 text-sm">
                  <div>
                    <div className="text-white/60 text-xs">Moneyline</div>
                    <div className="mt-1">{g.mlA}</div>
                    <div>{g.mlH}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs">Spread</div>
                    <div className="mt-1">{g.sprA}</div>
                    <div>{g.sprH}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs">Total</div>
                    <div className="mt-1">{g.tot}</div>
                  </div>
                </div>
                <div className="mt-3 h-1 rounded bg-gradient-to-r from-[#E31E24] via-[#F6C700] to-[#0B4DA2]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold">How it works</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              { t: "Sign up free", d: "Create your account in seconds." },
              { t: "Pick real games", d: "Use actual moneyline, spread, and total lines." },
              { t: "Track results", d: "See wins and ROI. Compete on leaderboards." },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="text-[#F6C700] font-semibold">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 font-semibold">{s.t}</div>
                <div className="text-white/70 text-sm mt-1">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing – Coming Soon */}
      <section className="border-t border-white/10 bg-white/3">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold">Pricing</h2>
          <p className="text-white/70 mt-1">Coming soon — beta testers get preferred pricing.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              { name: "Free", price: "$0", perks: ["$1,000 bankroll", "1 reset / month"] },
              { name: "User", price: "$10/mo", perks: ["1 reset / week", "Join contests"] },
              { name: "Super", price: "$25/mo", perks: ["Unlimited resets", "Join & create contests"] },
            ].map((p, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="font-semibold">{p.name}</div>
                <div className="text-3xl font-extrabold mt-2">{p.price}</div>
                <ul className="mt-4 space-y-2 text-sm text-white/80">
                  {p.perks.map((k, j) => <li key={j}>• {k}</li>)}
                </ul>
                <button className="mt-5 w-full rounded-lg border border-white/20 py-2 hover:bg-white/5">
                  Coming Soon
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beta signup + Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="md:flex items-center justify-between gap-6">
            <div>
              <div className="font-semibold">Get beta updates</div>
              <div className="text-white/70 text-sm">Enter your email to join the beta list.</div>
            </div>
            <form className="mt-4 md:mt-0 flex w-full max-w-md gap-2"
                  onSubmit={(e) => { e.preventDefault(); alert('Captured. Wire this to MailerLite later.'); }}>
              <input type="email" required placeholder="you@example.com"
                     className="flex-1 rounded-lg bg-white/10 px-3 py-2 outline-none placeholder-white/40" />
              <button className="rounded-lg bg-[#E31E24] px-4 py-2 font-semibold hover:bg-[#c3181f]">Notify me</button>
            </form>
          </div>
          <div className="mt-8 text-xs text-white/60">
            Play-money only. No real-money wagers or prizes. Overtime counts. See Terms.
            <div className="mt-2 flex gap-4">
              <a href="/terms" className="hover:underline">Terms</a>
              <a href="/privacy" className="hover:underline">Privacy</a>
              <a href="mailto:contact@example.com" className="hover:underline">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
