'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';

export function LoginForm() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      setAuthenticated(data.teamId, data.name);
      router.push(`/team/${data.teamId}`);
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email
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

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          disabled={isLoading}
          autoComplete="current-password"
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
        disabled={!email || !password}
      >
        Sign In
      </Button>

      <p className="text-sm text-center text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[var(--fpl-purple)] hover:underline font-medium">
          Create one
        </Link>
      </p>
    </form>
  );
}
