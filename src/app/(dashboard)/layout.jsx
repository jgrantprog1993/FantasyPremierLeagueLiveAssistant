import Link from 'next/link';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-[var(--fpl-purple)] text-white px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold hover:text-[var(--fpl-green)] transition-colors">
            FPL Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm hover:text-[var(--fpl-green)] transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Footer */}
      <footer className="bg-[var(--border)] py-4">
        <div className="container mx-auto px-4 text-center text-sm text-[var(--muted)]">
          FPL Dashboard - Not affiliated with the Premier League
        </div>
      </footer>
    </div>
  );
}
