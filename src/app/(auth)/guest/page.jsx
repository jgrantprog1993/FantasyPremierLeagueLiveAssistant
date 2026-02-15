import { GuestForm } from '@/components/features/auth/GuestForm';
import Link from 'next/link';

export const metadata = {
  title: 'Quick View - FPL Dashboard',
  description: 'View any FPL team by entering a Team ID',
};

export default function GuestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--fpl-purple)]">
              Quick View
            </h1>
            <p className="text-gray-600 mt-2">
              Enter a Team ID to view any FPL team
            </p>
          </div>

          <GuestForm />

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
            <p className="text-sm text-center text-gray-500">
              Want to save your Team ID?
            </p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="flex-1 text-center py-2 px-4 rounded-lg bg-[var(--fpl-purple)] text-white font-medium hover:bg-[#5a0052] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex-1 text-center py-2 px-4 rounded-lg border-2 border-[var(--fpl-purple)] text-[var(--fpl-purple)] font-medium hover:bg-[var(--fpl-purple)]/5 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
