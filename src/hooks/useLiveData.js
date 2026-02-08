'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentGameweek } from './useBootstrap';

/**
 * Fetch live gameweek data
 */
async function fetchLiveData(gameweek) {
  const response = await fetch(`/api/fpl/live/${gameweek}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch live data');
  }
  return response.json();
}

/**
 * Hook to fetch live gameweek data with auto-refresh during matches
 * @param {number} gameweek - The gameweek number (defaults to current)
 * @param {Object} options - Additional query options
 */
export function useLiveData(gameweek, options = {}) {
  const { data: currentGw } = useCurrentGameweek();

  // Use provided gameweek or fall back to current
  const gw = gameweek ?? currentGw?.id;

  // Determine if gameweek is finished
  const isFinished = currentGw?.finished ?? false;
  const isActive = !isFinished && currentGw?.is_current;

  return useQuery({
    queryKey: ['live', gw],
    queryFn: () => fetchLiveData(gw),
    enabled: !!gw,
    // Refresh every 30 seconds during active matches, less often otherwise
    refetchInterval: isActive ? 30000 : false,
    staleTime: isFinished ? 1000 * 60 * 60 * 24 : 1000 * 30, // 24h if finished, 30s if active
    ...options,
  });
}

/**
 * Hook to get live points for a specific player
 */
export function usePlayerLivePoints(playerId, gameweek) {
  const { data: liveData, ...rest } = useLiveData(gameweek);

  const playerLive = liveData?.elements?.find(e => e.id === playerId);

  return {
    ...rest,
    data: playerLive?.stats,
    explain: playerLive?.explain,
  };
}

/**
 * Calculate live points for a team's picks
 * @param {Array} picks - Team picks array
 * @param {Object} liveData - Live gameweek data
 * @returns {Object} - Points breakdown
 */
export function calculateTeamLivePoints(picks, liveData) {
  if (!picks || !liveData?.elements) {
    return { total: 0, starters: 0, bench: 0, captain: 0, autosubs: [] };
  }

  const liveMap = new Map(liveData.elements.map(e => [e.id, e]));

  let startersPoints = 0;
  let benchPoints = 0;
  let captainPoints = 0;

  picks.forEach(pick => {
    const live = liveMap.get(pick.element);
    const points = live?.stats?.total_points ?? 0;

    if (pick.position <= 11) {
      // Starter
      if (pick.is_captain) {
        captainPoints = points * pick.multiplier;
        startersPoints += captainPoints;
      } else if (pick.is_vice_captain) {
        startersPoints += points * pick.multiplier;
      } else {
        startersPoints += points;
      }
    } else {
      // Bench
      benchPoints += points;
    }
  });

  return {
    total: startersPoints,
    starters: startersPoints,
    bench: benchPoints,
    captain: captainPoints,
    autosubs: [], // Would need additional logic to calculate auto-subs
  };
}

/**
 * Hook to get live points with team context
 */
export function useTeamLivePoints(picks, gameweek) {
  const { data: liveData, ...rest } = useLiveData(gameweek);

  const points = calculateTeamLivePoints(picks, liveData);

  return {
    ...rest,
    points,
    liveData,
  };
}

/**
 * Get live stats for a player
 */
export function getPlayerLiveStats(playerId, liveData) {
  if (!liveData?.elements) return null;
  const playerLive = liveData.elements.find(e => e.id === playerId);
  return playerLive?.stats ?? null;
}

/**
 * Check if any matches are currently in progress
 */
export function useMatchesInProgress(fixtures) {
  const now = new Date();

  const inProgress = fixtures?.filter(f => {
    if (f.finished || f.finished_provisional) return false;
    if (!f.started) return false;
    return true;
  });

  return {
    inProgress: inProgress ?? [],
    hasLiveMatches: (inProgress?.length ?? 0) > 0,
  };
}
