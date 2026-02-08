'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Fetch team entry data
 */
async function fetchTeamEntry(teamId) {
  const response = await fetch(`/api/fpl/entry/${teamId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch team data');
  }
  return response.json();
}

/**
 * Fetch team history
 */
async function fetchTeamHistory(teamId) {
  const response = await fetch(`/api/fpl/entry/${teamId}/history`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch team history');
  }
  return response.json();
}

/**
 * Fetch team picks for a gameweek
 */
async function fetchTeamPicks(teamId, gameweek) {
  const response = await fetch(`/api/fpl/entry/${teamId}/picks/${gameweek}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch team picks');
  }
  return response.json();
}

/**
 * Fetch team transfers
 */
async function fetchTeamTransfers(teamId) {
  const response = await fetch(`/api/fpl/entry/${teamId}/transfers`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transfers');
  }
  return response.json();
}

/**
 * Hook to fetch team entry data
 */
export function useTeamEntry(teamId, options = {}) {
  return useQuery({
    queryKey: ['team', 'entry', teamId],
    queryFn: () => fetchTeamEntry(teamId),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch team history (past gameweeks, chips used, past seasons)
 */
export function useTeamHistory(teamId, options = {}) {
  return useQuery({
    queryKey: ['team', 'history', teamId],
    queryFn: () => fetchTeamHistory(teamId),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 15, // 15 minutes
    ...options,
  });
}

/**
 * Hook to fetch team picks for a specific gameweek
 */
export function useTeamPicks(teamId, gameweek, options = {}) {
  return useQuery({
    queryKey: ['team', 'picks', teamId, gameweek],
    queryFn: () => fetchTeamPicks(teamId, gameweek),
    enabled: !!teamId && !!gameweek,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch team transfer history
 */
export function useTeamTransfers(teamId, options = {}) {
  return useQuery({
    queryKey: ['team', 'transfers', teamId],
    queryFn: () => fetchTeamTransfers(teamId),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Combined hook to fetch all team data at once
 */
export function useTeamData(teamId, gameweek) {
  const entry = useTeamEntry(teamId);
  const history = useTeamHistory(teamId);
  const picks = useTeamPicks(teamId, gameweek);
  const transfers = useTeamTransfers(teamId);

  const isLoading = entry.isLoading || history.isLoading || picks.isLoading || transfers.isLoading;
  const isError = entry.isError || history.isError || picks.isError || transfers.isError;

  return {
    entry: entry.data,
    history: history.data,
    picks: picks.data,
    transfers: transfers.data,
    isLoading,
    isError,
    errors: {
      entry: entry.error,
      history: history.error,
      picks: picks.error,
      transfers: transfers.error,
    },
  };
}
