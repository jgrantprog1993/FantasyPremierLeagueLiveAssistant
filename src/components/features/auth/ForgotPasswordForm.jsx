'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-[var(--fpl-green)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[var(--fpl-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--fpl-purple)] mb-2">Check your email</h2>
        <p className="text-gray-600 mb-6">
          If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a password reset link.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Didn&apos;t receive the email? Check your spam folder or try again.
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="text-[var(--fpl-purple)] hover:underline font-medium"
        >
          Try another email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          disabled={isLoading}
          autoComplete="email"
          required
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--fpl-pink)]/10 border border-[var(--fpl-pink)]/20">
          <p className="text-sm text-[var(--fpl-pink)] font-medium">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={isLoading}
        disabled={!email}
      >
        Send Reset Link
      </Button>

      <p className="text-sm text-center text-gray-600">
        Remember your password?{' '}
        <Link href="/login" className="text-[var(--fpl-purple)] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
