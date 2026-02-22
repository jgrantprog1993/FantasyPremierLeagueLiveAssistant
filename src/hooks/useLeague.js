import { useQuery, useQueries } from '@tanstack/react-query';

/**
 * Fetch league standings
 */
async function fetchLeagueStandings(leagueId, page = 1) {
  const response = await fetch(`/api/fpl/leagues/${leagueId}?page=${page}`);
  if (!response.ok) {
    throw new Error('Failed to fetch league standings');
  }
  return response.json();
}

/**
 * Fetch a team's picks for a gameweek
 */
async function fetchTeamPicks(teamId, gameweek) {
  const response = await fetch(`/api/fpl/entry/${teamId}/picks/${gameweek}`);
  if (!response.ok) {
    throw new Error('Failed to fetch team picks');
  }
  return response.json();
}

/**
 * Fetch a team's history
 */
async function fetchTeamHistory(teamId) {
  const response = await fetch(`/api/fpl/entry/${teamId}/history`);
  if (!response.ok) {
    throw new Error('Failed to fetch team history');
  }
  const data = await response.json();
  return { ...data, entry: teamId };
}

/**
 * Hook to fetch league standings
 */
export function useLeagueStandings(leagueId, options = {}) {
  return useQuery({
    queryKey: ['league', leagueId],
    queryFn: () => fetchLeagueStandings(leagueId),
    enabled: !!leagueId,
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

/**
 * Hook to fetch multiple teams' picks for differential calculation
 */
export function useLeagueTeamsPicks(teamIds, gameweek, options = {}) {
  const queries = useQueries({
    queries: (teamIds || []).map((teamId) => ({
      queryKey: ['picks', teamId, gameweek],
      queryFn: () => fetchTeamPicks(teamId, gameweek),
      enabled: !!teamId && !!gameweek,
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    })),
    ...options,
  });

  return {
    data: queries.map((q) => q.data).filter(Boolean),
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
}

/**
 * Hook to fetch multiple teams' histories for chip tracking
 */
export function useLeagueTeamsHistories(teamIds, options = {}) {
  const queries = useQueries({
    queries: (teamIds || []).map((teamId) => ({
      queryKey: ['history', teamId],
      queryFn: () => fetchTeamHistory(teamId),
      enabled: !!teamId,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    })),
    ...options,
  });

  return {
    data: queries.map((q) => q.data).filter(Boolean),
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
}

/**
 * Get chips remaining for a team based on history
 */
export function getChipsRemaining(history) {
  const allChips = ['wildcard', 'freehit', 'bboost', '3xc'];
  const usedChips = history?.chips?.map(c => c.name) || [];

  // Wildcard can be used twice (one per half of season)
  const wildcardCount = usedChips.filter(c => c === 'wildcard').length;
  const hasWildcard = wildcardCount < 2;

  return allChips.filter(chip => {
    if (chip === 'wildcard') return hasWildcard;
    return !usedChips.includes(chip);
  });
}

/**
 * Calculate differential players
 * Returns players that the user has but others in the league don't (or have low ownership)
 */
export function calculateDifferentials(userPicks, leaguePicks, playerMap) {
  if (!userPicks?.picks || !leaguePicks?.length || !playerMap) {
    return [];
  }

  // Count how many teams in the league have each player
  const playerOwnership = new Map();

  leaguePicks.forEach((teamPicks) => {
    if (!teamPicks?.picks) return;

    teamPicks.picks
      .filter((p) => p.position <= 11)
      .forEach((pick) => {
        const count = playerOwnership.get(pick.element) || 0;
        playerOwnership.set(pick.element, count + 1);
      });
  });

  const totalTeams = leaguePicks.length;

  // Find differentials (players with low ownership in the league)
  const differentials = [];

  userPicks.picks
    .filter((p) => p.position <= 11)
    .forEach((pick) => {
      const leagueCount = playerOwnership.get(pick.element) || 0;
      // Consider it a differential if less than 30% of league has the player
      const ownershipPct = totalTeams > 0 ? (leagueCount / totalTeams) * 100 : 0;

      const player = playerMap.get(pick.element);
      differentials.push({
        ...pick,
        player,
        leagueOwnership: leagueCount,
        leagueOwnershipPct: ownershipPct,
        totalTeams,
        isUnique: leagueCount <= 1,
        isDifferential: ownershipPct < 30,
      });
    });

  // Sort by ownership (lowest first = most differential)
  differentials.sort((a, b) => a.leagueOwnershipPct - b.leagueOwnershipPct);

  return differentials;
}
