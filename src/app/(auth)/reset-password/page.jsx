import { ResetPasswordForm } from '@/components/features/auth/ResetPasswordForm';

export const metadata = {
  title: 'Reset Password - FPL Dashboard',
  description: 'Create a new password for your FPL Dashboard account',
};

export default async function ResetPasswordPage({ searchParams }) {
  const { token } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--fpl-purple)]">
              Reset Password
            </h1>
            <p className="text-gray-600 mt-2">
              Enter your new password below
            </p>
          </div>

          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
