'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

/**
 * Guest mode form - Enter Team ID to view public data
 */
export function GuestForm() {
  const router = useRouter();
  const [teamId, setTeamId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validate Team ID
    const id = parseInt(teamId.trim(), 10);
    if (isNaN(id) || id <= 0) {
      setError('Please enter a valid Team ID');
      return;
    }

    setIsLoading(true);

    try {
      // Verify the team exists by calling our API
      const response = await fetch(`/api/fpl/entry/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Team not found. Please check the ID and try again.');
        }
        throw new Error('Failed to verify team. Please try again.');
      }

      // Team exists, redirect to team page
      router.push(`/team/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-1.5">
          Team ID
        </label>
        <Input
          id="teamId"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="Enter your FPL Team ID"
          error={error}
          disabled={isLoading}
          required
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="secondary"
        className="w-full"
        loading={isLoading}
        disabled={!teamId.trim()}
      >
        View Team
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Find your Team ID in the URL when viewing your team on the official FPL website.
      </p>
    </form>
  );
}
