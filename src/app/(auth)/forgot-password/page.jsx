import { ForgotPasswordForm } from '@/components/features/auth/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password - FPL Dashboard',
  description: 'Reset your FPL Dashboard password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--fpl-purple)]">
              Forgot Password?
            </h1>
            <p className="text-gray-600 mt-2">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
