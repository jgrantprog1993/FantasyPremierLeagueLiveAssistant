import Link from 'next/link';
import { GuestForm } from '@/components/features/auth/GuestForm';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header - FPL Style */}
      <header className="bg-[var(--fpl-purple)]">
        <div className="container mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[var(--fpl-green)] flex items-center justify-center">
                <span className="text-[var(--fpl-purple)] font-bold text-sm">FPL</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">Dashboard</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                Home
              </Link>
              <Link href="#features" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                Features
              </Link>
            </nav>
          </div>

          {/* Hero */}
          <div className="py-12 md:py-20 text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Fantasy Premier League
              <span className="block text-[var(--fpl-green)]">Dashboard</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto">
              Track your team, analyze player stats, and follow live gameweek scores
            </p>
          </div>
        </div>

        {/* Decorative gradient bar */}
        <div className="h-1 bg-gradient-to-r from-[var(--fpl-green)] via-[var(--fpl-cyan)] to-[var(--fpl-pink)]"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        {/* Quick View Entry */}
        <div className="max-w-md mx-auto mt-4 md:mt-8">
          <div className="fpl-card p-6 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">View Any Team</h2>
              <p className="text-[var(--foreground)]/70 text-sm mt-2">
                Enter a Team ID to view team picks, gameweek scores, and league standings
              </p>
            </div>
            <GuestForm />
            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--foreground)]/60 text-center">
                Find your Team ID on the FPL website under the Points or Picks tab in the URL
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="mt-16 md:mt-24">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            What you can do
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <FeatureCard
              icon={<TeamIcon />}
              title="Team Stats"
              description="View detailed team statistics and overall performance"
              color="var(--fpl-green)"
            />
            <FeatureCard
              icon={<LiveIcon />}
              title="Live Scores"
              description="Real-time gameweek points during matches"
              color="var(--fpl-cyan)"
            />
            <FeatureCard
              icon={<TransferIcon />}
              title="Transfers"
              description="Track your complete transfer history"
              color="var(--fpl-pink)"
            />
            <FeatureCard
              icon={<LeagueIcon />}
              title="Leagues"
              description="Check standings and compare with rivals"
              color="var(--fpl-yellow)"
            />
          </div>
        </section>

        {/* Stats Preview */}
        <section className="mt-16 md:mt-24 max-w-4xl mx-auto">
          <div className="fpl-card p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#37003c]">11M+</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide">Managers</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#00b35c]">38</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide">Gameweeks</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#0099cc]">600+</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide">Players</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#e6246e]">20</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide">Teams</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--fpl-purple)] text-white/60 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>
            Not affiliated with the Premier League or Fantasy Premier League.
          </p>
          <p className="mt-1">
            Data provided by the official FPL API.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }) {
  return (
    <div className="fpl-card p-5 text-center hover:shadow-lg transition-shadow">
      <div
        className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

// Simple SVG Icons
function TeamIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function LiveIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function LeagueIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}
