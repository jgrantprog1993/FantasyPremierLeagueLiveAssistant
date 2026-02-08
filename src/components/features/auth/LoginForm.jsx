'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';

/**
 * Login form for FPL authentication
 */
export function LoginForm() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setHint('');
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
        if (data.hint) {
          setHint(data.hint);
        }
        return;
      }

      // Update auth store
      setAuthenticated(data.teamId, data.name);

      // Redirect to team page
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
          FPL Email
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
          placeholder="Your FPL password"
          disabled={isLoading}
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--fpl-pink)]/10 border border-[var(--fpl-pink)]/20">
          <p className="text-sm text-[var(--fpl-pink)] font-medium">{error}</p>
          {hint && (
            <p className="text-xs text-[var(--muted)] mt-1">{hint}</p>
          )}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={isLoading}
        disabled={!email || !password}
      >
        Sign in with FPL
      </Button>

      <div className="text-xs text-gray-500 space-y-1">
        <p>
          Your credentials are sent directly to the FPL server.
          We never store your password.
        </p>
        <p className="text-gray-700 font-medium">
          Note: If login fails, you can still use Quick View with your Team ID.
        </p>
      </div>
    </form>
  );
}
