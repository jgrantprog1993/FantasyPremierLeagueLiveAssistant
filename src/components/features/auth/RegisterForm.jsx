'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';

/**
 * Registration form for creating a new account
 */
export function RegisterForm() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    teamId: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingTeam, setIsValidatingTeam] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  async function validateTeamId(teamId) {
    if (!teamId) return false;

    const id = parseInt(teamId.trim(), 10);
    if (isNaN(id) || id <= 0) return false;

    setIsValidatingTeam(true);
    try {
      const response = await fetch(`/api/fpl/entry/${id}`);
      return response.ok;
    } catch {
      return false;
    } finally {
      setIsValidatingTeam(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validation
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.teamId) {
      errors.teamId = 'Team ID is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      // Validate Team ID exists
      const teamValid = await validateTeamId(formData.teamId);
      if (!teamValid) {
        setFieldErrors({ teamId: 'Team ID not found. Please check and try again.' });
        setIsLoading(false);
        return;
      }

      // Submit registration
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          teamId: formData.teamId,
          name: formData.name || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Update auth store
      setAuthenticated(data.user.teamId, data.user.name, data.user.id);

      // Redirect to team page
      router.push(`/team/${data.user.teamId}`);
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
          Email <span className="text-[var(--fpl-pink)]">*</span>
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your.email@example.com"
          disabled={isLoading}
          autoComplete="email"
          error={fieldErrors.email}
        />
        {fieldErrors.email && (
          <p className="mt-1 text-sm text-[var(--fpl-pink)]">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
          Password <span className="text-[var(--fpl-pink)]">*</span>
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Minimum 8 characters"
          disabled={isLoading}
          autoComplete="new-password"
          error={fieldErrors.password}
        />
        {fieldErrors.password && (
          <p className="mt-1 text-sm text-[var(--fpl-pink)]">{fieldErrors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
          Confirm Password <span className="text-[var(--fpl-pink)]">*</span>
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter your password"
          disabled={isLoading}
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
        />
        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-sm text-[var(--fpl-pink)]">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      <div>
        <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-1.5">
          FPL Team ID <span className="text-[var(--fpl-pink)]">*</span>
        </label>
        <Input
          id="teamId"
          name="teamId"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={formData.teamId}
          onChange={handleChange}
          placeholder="Your FPL Team ID"
          disabled={isLoading}
          error={fieldErrors.teamId}
        />
        {fieldErrors.teamId && (
          <p className="mt-1 text-sm text-[var(--fpl-pink)]">{fieldErrors.teamId}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Find this in the URL when viewing your team on fantasy.premierleague.com
        </p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
          Display Name <span className="text-gray-400">(optional)</span>
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="How you want to be called"
          disabled={isLoading}
          autoComplete="name"
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
        loading={isLoading || isValidatingTeam}
        disabled={!formData.email || !formData.password || !formData.teamId}
      >
        Create Account
      </Button>

      <p className="text-sm text-center text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--fpl-purple)] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
