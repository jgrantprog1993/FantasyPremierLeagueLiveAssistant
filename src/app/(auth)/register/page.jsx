import { RegisterForm } from '@/components/features/auth/RegisterForm';
import Link from 'next/link';

export const metadata = {
  title: 'Create Account - FPL Dashboard',
  description: 'Create an account to save your FPL Team ID and access your dashboard',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--fpl-purple)]">
              Create Account
            </h1>
            <p className="text-gray-600 mt-2">
              Save your Team ID and auto-load on return
            </p>
          </div>

          <RegisterForm />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-center text-gray-500 mb-3">
              Just want to view a team?
            </p>
            <Link
              href="/guest"
              className="block w-full text-center py-2 px-4 rounded-lg border-2 border-[var(--fpl-green)] text-[var(--fpl-purple)] font-medium hover:bg-[var(--fpl-green)]/10 transition-colors"
            >
              Continue as Guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
