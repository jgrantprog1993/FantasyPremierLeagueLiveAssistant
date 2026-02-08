'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Fetch bootstrap data from our API proxy
 */
async function fetchBootstrap() {
  const response = await fetch('/api/fpl/bootstrap');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch bootstrap data');
  }
  return response.json();
}

/**
 * Hook to fetch and cache FPL bootstrap data
 * Contains all players, teams, gameweeks, and game settings
 */
export function useBootstrap(options = {}) {
  return useQuery({
    queryKey: ['bootstrap'],
    queryFn: fetchBootstrap,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    ...options,
  });
}

/**
 * Hook to get current gameweek from bootstrap data
 */
export function useCurrentGameweek() {
  const { data, ...rest } = useBootstrap();

  const currentGameweek = data?.events?.find(e => e.is_current);
  const nextGameweek = data?.events?.find(e => e.is_next);

  return {
    ...rest,
    data: currentGameweek,
    nextGameweek,
    allGameweeks: data?.events,
  };
}

/**
 * Hook to get all players from bootstrap data
 */
export function usePlayers() {
  const { data, ...rest } = useBootstrap();

  return {
    ...rest,
    data: data?.elements,
    teams: data?.teams,
    positions: data?.element_types,
  };
}

/**
 * Hook to get a single player by ID
 */
export function usePlayer(playerId) {
  const { data, ...rest } = usePlayers();

  const player = data?.find(p => p.id === playerId);

  return {
    ...rest,
    data: player,
  };
}

/**
 * Hook to get all teams from bootstrap data
 */
export function useTeams() {
  const { data, ...rest } = useBootstrap();

  return {
    ...rest,
    data: data?.teams,
  };
}

/**
 * Hook to get a single team by ID
 */
export function useTeamById(teamId) {
  const { data, ...rest } = useTeams();

  const team = data?.find(t => t.id === teamId);

  return {
    ...rest,
    data: team,
  };
}

/**
 * Utility function to create a lookup map from bootstrap data
 */
export function createPlayerMap(players) {
  if (!players) return new Map();
  return new Map(players.map(p => [p.id, p]));
}

export function createTeamMap(teams) {
  if (!teams) return new Map();
  return new Map(teams.map(t => [t.id, t]));
}

export function createPositionMap(positions) {
  if (!positions) return new Map();
  return new Map(positions.map(p => [p.id, p]));
}

/**
 * Fetch fixtures from our API proxy
 */
async function fetchFixtures(gameweek) {
  const url = gameweek ? `/api/fpl/fixtures?gw=${gameweek}` : '/api/fpl/fixtures';
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch fixtures');
  }
  return response.json();
}

/**
 * Hook to fetch fixtures for a specific gameweek
 */
export function useFixtures(gameweek, options = {}) {
  return useQuery({
    queryKey: ['fixtures', gameweek],
    queryFn: () => fetchFixtures(gameweek),
    enabled: !!gameweek,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}
