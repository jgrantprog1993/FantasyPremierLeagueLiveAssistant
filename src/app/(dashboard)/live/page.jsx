'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { useTeamEntry, useTeamPicks } from '@/hooks/useTeam';
import { useBootstrap, createPlayerMap, createTeamMap, useFixtures } from '@/hooks/useBootstrap';
import { useLiveData } from '@/hooks/useLiveData';
import { useLeagueStandings, useLeagueTeamsPicks, calculateDifferentials } from '@/hooks/useLeague';
import { getShirtUrl } from '@/lib/fpl/endpoints';
import { cn } from '@/lib/utils/cn';

export default function LiveTrackerPage() {
  return (
    <Suspense fallback={<LiveTrackerSkeleton />}>
      <LiveTrackerContent />
    </Suspense>
  );
}

function LiveTrackerSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-[var(--border)] rounded w-1/3"></div>
        <div className="h-64 bg-[var(--border)] rounded"></div>
      </div>
    </div>
  );
}

function LiveTrackerContent() {
  const searchParams = useSearchParams();
  const teamIdParam = searchParams.get('team');

  const [teamId, setTeamId] = useState(teamIdParam || '');
  const [submittedTeamId, setSubmittedTeamId] = useState(teamIdParam || '');
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);

  // Fetch bootstrap data
  const { data: bootstrap, isLoading: bootstrapLoading } = useBootstrap();

  // Get current gameweek
  const currentGw = bootstrap?.events?.find(e => e.is_current)?.id;

  // Fetch team data
  const { data: team, isLoading: teamLoading, error: teamError } = useTeamEntry(submittedTeamId);

  // Fetch picks for current gameweek
  const { data: picksData, isLoading: picksLoading } = useTeamPicks(submittedTeamId, currentGw);

  // Fetch live data with auto-refresh
  const { data: liveData, isLoading: liveLoading, dataUpdatedAt } = useLiveData(currentGw);

  // Fetch fixtures
  const { data: fixtures } = useFixtures(currentGw);

  // Get user's private classic leagues only (exclude public leagues like "All Ireland")
  const userLeagues = useMemo(() => {
    if (!team?.leagues?.classic) return [];
    return team.leagues.classic.filter(l => l.league_type === 'x');
  }, [team]);

  // Fetch selected league standings
  const { data: leagueData, isLoading: leagueLoading } = useLeagueStandings(selectedLeagueId);

  // Get team IDs from league (excluding current user)
  const leagueTeamIds = useMemo(() => {
    if (!leagueData?.standings?.results) return [];
    return leagueData.standings.results
      .filter(r => r.entry !== parseInt(submittedTeamId))
      .map(r => r.entry);
  }, [leagueData, submittedTeamId]);

  // Fetch all league teams' picks
  const { data: leagueTeamsPicks, isLoading: leaguePicksLoading } = useLeagueTeamsPicks(
    leagueTeamIds,
    currentGw
  );

  // Create lookup maps
  const playerMap = useMemo(() => createPlayerMap(bootstrap?.elements), [bootstrap?.elements]);
  const teamMap = useMemo(() => createTeamMap(bootstrap?.teams), [bootstrap?.teams]);

  // Calculate differentials
  const differentials = useMemo(() => {
    return calculateDifferentials(picksData, leagueTeamsPicks, playerMap);
  }, [picksData, leagueTeamsPicks, playerMap]);

  // Calculate live league standings
  const liveStandings = useMemo(() => {
    if (!leagueData?.standings?.results || !liveData?.elements) return [];

    const livePointsMap = new Map(liveData.elements.map(e => [e.id, e.stats?.total_points ?? 0]));

    // Calculate live points for each team in the standings
    const standings = leagueData.standings.results.map(entry => {
      // Find this team's picks in our fetched data
      const teamPicks = leagueTeamsPicks?.find(tp => tp?.entry === entry.entry);

      let liveGwPoints = entry.event_total; // Default to API value

      if (teamPicks?.picks) {
        // Calculate live points from picks
        liveGwPoints = teamPicks.picks
          .filter(p => p.position <= 11)
          .reduce((sum, pick) => {
            const points = livePointsMap.get(pick.element) ?? 0;
            const multiplier = pick.is_captain ? (pick.multiplier ?? 2) : 1;
            return sum + (points * multiplier);
          }, 0);
      }

      // For current user, use our calculated points
      if (entry.entry === parseInt(submittedTeamId) && picksData?.picks) {
        liveGwPoints = picksData.picks
          .filter(p => p.position <= 11)
          .reduce((sum, pick) => {
            const points = livePointsMap.get(pick.element) ?? 0;
            const multiplier = pick.is_captain ? (pick.multiplier ?? 2) : 1;
            return sum + (points * multiplier);
          }, 0);
      }

      // Calculate live total (previous total + live GW points)
      const previousTotal = entry.total - entry.event_total;
      const liveTotal = previousTotal + liveGwPoints;

      return {
        ...entry,
        liveGwPoints,
        liveTotal,
        isCurrentUser: entry.entry === parseInt(submittedTeamId),
      };
    });

    // Sort by live total points (descending)
    standings.sort((a, b) => b.liveTotal - a.liveTotal);

    // Add live rank
    return standings.map((entry, index) => ({
      ...entry,
      liveRank: index + 1,
      rankChange: entry.rank - (index + 1),
    }));
  }, [leagueData, liveData, leagueTeamsPicks, picksData, submittedTeamId]);

  // Create fixture map by team
  const fixtureByTeam = useMemo(() => {
    if (!fixtures) return new Map();
    const map = new Map();
    fixtures.forEach(f => {
      map.set(f.team_h, f);
      map.set(f.team_a, f);
    });
    return map;
  }, [fixtures]);

  // Get live element data map
  const liveElementMap = useMemo(() => {
    if (!liveData?.elements) return new Map();
    return new Map(liveData.elements.map(e => [e.id, e]));
  }, [liveData]);

  // Process picks with live data
  const processedPicks = useMemo(() => {
    if (!picksData?.picks) return [];

    return picksData.picks.map(pick => {
      const player = playerMap.get(pick.element);
      const liveElement = liveElementMap.get(pick.element);
      const team = teamMap.get(player?.team);
      const fixture = fixtureByTeam.get(player?.team);

      // Get bonus points
      const bonus = liveElement?.stats?.bonus ?? 0;
      const bps = liveElement?.stats?.bps ?? 0;

      // Calculate provisional bonus from fixture stats
      let provisionalBonus = 0;
      if (fixture && !fixture.finished && fixture.started) {
        // Get BPS leaders from fixture
        const bpsStats = fixture.stats?.find(s => s.identifier === 'bps');
        if (bpsStats) {
          const allBps = [...(bpsStats.h || []), ...(bpsStats.a || [])];
          allBps.sort((a, b) => b.value - a.value);

          // Find player's position in BPS ranking
          const playerBpsIndex = allBps.findIndex(b => b.element === pick.element);
          if (playerBpsIndex === 0) provisionalBonus = 3;
          else if (playerBpsIndex === 1) provisionalBonus = 2;
          else if (playerBpsIndex === 2) provisionalBonus = 1;
          // Handle ties
          if (playerBpsIndex > 0 && allBps[playerBpsIndex]?.value === allBps[0]?.value) provisionalBonus = 3;
          else if (playerBpsIndex > 1 && allBps[playerBpsIndex]?.value === allBps[1]?.value) provisionalBonus = 2;
        }
      }

      const basePoints = liveElement?.stats?.total_points ?? 0;
      const pointsWithMultiplier = pick.is_captain ? basePoints * (pick.multiplier ?? 2) : basePoints;

      return {
        ...pick,
        player,
        team,
        fixture,
        liveStats: liveElement?.stats,
        basePoints,
        points: pointsWithMultiplier,
        bonus,
        bps,
        provisionalBonus: fixture?.finished ? 0 : provisionalBonus,
        isPlaying: fixture?.started && !fixture?.finished,
        isFinished: fixture?.finished || fixture?.finished_provisional,
      };
    });
  }, [picksData, playerMap, teamMap, fixtureByTeam, liveElementMap]);

  // Split into starters and bench
  const starters = processedPicks.filter(p => p.position <= 11);
  const bench = processedPicks.filter(p => p.position > 11);

  // Calculate totals
  const totalPoints = starters.reduce((sum, p) => sum + p.points, 0);
  const playersPlaying = starters.filter(p => p.isPlaying).length;
  const playersFinished = starters.filter(p => p.isFinished).length;
  const playersYetToPlay = starters.filter(p => !p.isPlaying && !p.isFinished).length;

  // Format last updated time
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedTeamId(teamId);
  };

  const isLoading = bootstrapLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-[var(--border)] rounded w-1/3"></div>
          <div className="h-64 bg-[var(--border)] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--fpl-purple)] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span>Live Tracker</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Live Gameweek {currentGw}
              </h1>
              {team && (
                <p className="text-[var(--fpl-green)] mt-1">{team.name}</p>
              )}
            </div>
            {lastUpdated && (
              <div className="text-right text-sm text-white/60">
                <p>Last updated</p>
                <p className="text-white">{lastUpdated}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Team ID Input */}
        {!submittedTeamId && (
          <Card className="max-w-md mx-auto mb-8">
            <CardContent className="py-6">
              <h2 className="text-lg font-semibold mb-4 text-center">Enter Team ID</h2>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  placeholder="e.g. 123456"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fpl-purple)]"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-[var(--fpl-purple)] text-white rounded-lg hover:bg-[var(--fpl-purple-light)] transition-colors font-medium"
                >
                  Track
                </button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {teamError && (
          <Card className="border-red-500 max-w-md mx-auto mb-8">
            <CardContent className="py-6 text-center">
              <p className="text-red-500">Team not found. Please check the ID.</p>
              <button
                onClick={() => setSubmittedTeamId('')}
                className="mt-4 text-[var(--fpl-purple)] hover:underline"
              >
                Try another ID
              </button>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {submittedTeamId && (teamLoading || picksLoading || liveLoading) && !teamError && (
          <div className="max-w-4xl mx-auto animate-pulse space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-[var(--border)] rounded"></div>
              <div className="h-24 bg-[var(--border)] rounded"></div>
              <div className="h-24 bg-[var(--border)] rounded"></div>
            </div>
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-16 bg-[var(--border)] rounded"></div>
              ))}
            </div>
          </div>
        )}

        {/* Live Data */}
        {team && picksData && !teamError && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-[var(--muted)] uppercase">Live Points</p>
                  <p className="text-3xl font-bold text-[var(--fpl-green)]">{totalPoints}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-[var(--muted)] uppercase">Playing</p>
                  <p className="text-3xl font-bold text-[var(--fpl-cyan)]">{playersPlaying}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-[var(--muted)] uppercase">Finished</p>
                  <p className="text-3xl font-bold text-gray-500">{playersFinished}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-[var(--muted)] uppercase">Yet to Play</p>
                  <p className="text-3xl font-bold">{playersYetToPlay}</p>
                </CardContent>
              </Card>
            </div>

            {/* League Ownership Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  GW{currentGw} League Ownership
                </h2>
                {userLeagues.length > 0 && (
                  <select
                    value={selectedLeagueId || ''}
                    onChange={(e) => setSelectedLeagueId(e.target.value || null)}
                    className="px-4 py-2 border-2 border-[var(--fpl-purple)] rounded-lg text-sm font-medium text-[var(--fpl-purple)] focus:outline-none focus:ring-2 focus:ring-[var(--fpl-purple)] bg-white cursor-pointer"
                  >
                    <option value="">Select a league</option>
                    {userLeagues.map((league) => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {!selectedLeagueId && (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    <p>Select a league above to see ownership in your mini-league</p>
                    <p className="text-sm mt-1">See which of your players are differentials</p>
                  </CardContent>
                </Card>
              )}

              {selectedLeagueId && (leagueLoading || leaguePicksLoading) && (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-[var(--border)] rounded"></div>
                  ))}
                </div>
              )}

              {selectedLeagueId && !leagueLoading && !leaguePicksLoading && differentials.length > 0 && (
                <div className="space-y-2">
                  {differentials.map((diff) => (
                    <DifferentialRow
                      key={diff.element}
                      differential={diff}
                      teamMap={teamMap}
                      liveElementMap={liveElementMap}
                      fixtureByTeam={fixtureByTeam}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Live League Standings */}
            {selectedLeagueId && !leagueLoading && liveStandings.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">
                  Live Standings - {leagueData?.league?.name}
                </h2>
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-3 text-xs text-white/60 font-medium">Live</th>
                          <th className="text-left py-3 px-2 text-xs text-white/60 font-medium">Team</th>
                          <th className="text-right py-3 px-2 text-xs text-white/60 font-medium">GW</th>
                          <th className="text-right py-3 px-3 text-xs text-white/60 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveStandings.map((entry) => (
                          <tr
                            key={entry.id}
                            className={cn(
                              'border-b border-white/5',
                              entry.isCurrentUser && 'bg-[var(--fpl-purple)]/20'
                            )}
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  'font-bold text-sm',
                                  entry.liveRank <= 3 ? 'text-[var(--fpl-green)]' : 'text-white'
                                )}>
                                  {entry.liveRank}
                                </span>
                                {entry.rankChange !== 0 && (
                                  <span className={cn(
                                    'text-xs',
                                    entry.rankChange > 0 ? 'text-green-400' : 'text-red-400'
                                  )}>
                                    {entry.rankChange > 0 ? `▲${entry.rankChange}` : `▼${Math.abs(entry.rankChange)}`}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <p className={cn(
                                'font-medium text-sm truncate max-w-[150px]',
                                entry.isCurrentUser ? 'text-[var(--fpl-green)]' : 'text-white'
                              )}>
                                {entry.entry_name}
                              </p>
                              <p className="text-xs text-white/50">{entry.player_name}</p>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className={cn(
                                'text-sm font-medium',
                                entry.liveGwPoints > entry.event_total ? 'text-[var(--fpl-green)]' : 'text-white/80'
                              )}>
                                {entry.liveGwPoints}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="font-bold text-white">{entry.liveTotal}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Match Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--fpl-green)] animate-pulse"></div>
                <span className="text-gray-600">Playing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-600">Finished</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                <span className="text-gray-600">Yet to play</span>
              </div>
            </div>

            {/* Starters */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Starting XI</h2>
              <div className="space-y-2">
                {starters.map((pick) => (
                  <PlayerRow key={pick.element} pick={pick} teamMap={teamMap} />
                ))}
              </div>
            </div>

            {/* Bench */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-500">Bench</h2>
              <div className="space-y-2 opacity-60">
                {bench.map((pick) => (
                  <PlayerRow key={pick.element} pick={pick} teamMap={teamMap} />
                ))}
              </div>
            </div>

            {/* Change Team */}
            <div className="flex gap-3">
              <Link
                href={`/team/${submittedTeamId}`}
                className="px-4 py-2 bg-[var(--fpl-purple)]/10 text-[var(--fpl-purple)] rounded-lg hover:bg-[var(--fpl-purple)]/20 transition-colors text-sm font-medium"
              >
                View Full Team
              </Link>
              <button
                onClick={() => setSubmittedTeamId('')}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Track Different Team
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/**
 * Player row component
 */
function PlayerRow({ pick, teamMap }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { player, team, fixture, points, basePoints, bonus, bps, provisionalBonus, isPlaying, isFinished, liveStats } = pick;

  if (!player) return null;

  const shirtUrl = team?.code ? getShirtUrl(team.code, player.element_type === 1) : null;

  // Player availability status
  const isInjured = player.status === 'i';
  const isDoubtful = player.status === 'd';
  const isSuspended = player.status === 's';
  const isUnavailable = player.status === 'u' || player.status === 'n';
  const hasIssue = isInjured || isDoubtful || isSuspended || isUnavailable;

  // Format fixture score
  const getFixtureDisplay = () => {
    if (!fixture) return null;

    const homeTeam = fixture.team_h === player.team;
    const opponentId = homeTeam ? fixture.team_a : fixture.team_h;
    const opponentTeam = teamMap?.get(opponentId);
    const homeScore = fixture.team_h_score ?? 0;
    const awayScore = fixture.team_a_score ?? 0;
    const score = `${homeScore}-${awayScore}`;

    return {
      opponent: opponentTeam?.short_name || opponentId,
      score: fixture.started ? score : null,
      isHome: homeTeam,
    };
  };

  const fixtureInfo = getFixtureDisplay();

  // Get stats breakdown for accordion
  const statsBreakdown = getStatsBreakdown(liveStats, player.element_type);

  // Determine ring color based on status
  const getRingClass = () => {
    if (isInjured || isUnavailable) return 'ring-2 ring-red-500';
    if (isDoubtful) return 'ring-2 ring-yellow-500';
    if (isSuspended) return 'ring-2 ring-orange-500';
    if (isPlaying) return 'ring-2 ring-[var(--fpl-green)]';
    return '';
  };

  return (
    <Card className={cn(
      'overflow-hidden transition-all',
      getRingClass(),
      isFinished && !hasIssue && 'opacity-70'
    )}>
      <div
        className="flex items-center p-3 gap-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Status indicator */}
        <div className={cn(
          'w-2 h-12 rounded-full flex-shrink-0',
          isPlaying ? 'bg-[var(--fpl-green)] animate-pulse' : isFinished ? 'bg-gray-400' : 'bg-gray-200'
        )} />

        {/* Jersey */}
        <div className="w-10 h-12 relative flex-shrink-0">
          {shirtUrl && (
            <Image
              src={shirtUrl}
              alt={team?.name ?? ''}
              width={40}
              height={48}
              className="object-contain"
              unoptimized
            />
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white truncate text-base">
              {player.web_name}
            </span>
            {pick.is_captain && (
              <span className="px-1.5 py-0.5 bg-[var(--fpl-purple)] text-white text-xs font-bold rounded">
                C
              </span>
            )}
            {pick.is_vice_captain && !pick.is_captain && (
              <span className="px-1.5 py-0.5 bg-[var(--fpl-purple)]/50 text-white text-xs font-bold rounded">
                V
              </span>
            )}
          </div>
          <div className="text-sm text-white/80 flex items-center gap-2">
            <span>{team?.short_name}</span>
            {fixtureInfo && (
              <>
                <span>•</span>
                <span>
                  {fixtureInfo.isHome ? 'vs' : '@'} {fixtureInfo.opponent}
                  {fixtureInfo.score && ` (${fixtureInfo.score})`}
                </span>
              </>
            )}
          </div>
        </div>

        {/* BPS */}
        <div className="text-center px-2 flex-shrink-0">
          <p className="text-xs text-gray-400 uppercase">BPS</p>
          <p className="text-sm font-medium text-gray-600">{bps}</p>
        </div>

        {/* Bonus */}
        <div className="text-center px-2 flex-shrink-0 min-w-[50px]">
          <p className="text-xs text-gray-400 uppercase">Bonus</p>
          {bonus > 0 ? (
            <p className="text-sm font-bold text-[var(--fpl-green)]">+{bonus}</p>
          ) : provisionalBonus > 0 ? (
            <p className="text-sm font-medium text-[var(--fpl-cyan)]">+{provisionalBonus}*</p>
          ) : (
            <p className="text-sm text-gray-400">-</p>
          )}
        </div>

        {/* Points */}
        <div className={cn(
          'text-center px-3 py-2 rounded-lg flex-shrink-0 min-w-[60px]',
          isFinished ? 'bg-gray-100' : points > 0 ? 'bg-[var(--fpl-green)]/10' : 'bg-gray-100'
        )}>
          <p className="text-xs text-gray-400 uppercase">Pts</p>
          <p className={cn(
            'text-lg font-bold',
            isFinished ? 'text-gray-600' : points > 0 ? 'text-[var(--fpl-green)]' : 'text-gray-600'
          )}>
            {points}
          </p>
          {pick.is_captain && basePoints !== points && (
            <p className="text-[10px] text-gray-400">({basePoints}×2)</p>
          )}
        </div>

        {/* Expand indicator */}
        <div className="flex-shrink-0">
          <svg
            className={cn('w-5 h-5 text-gray-400 transition-transform', isExpanded && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/10">
          {/* Player Status Alert */}
          {hasIssue && player.news && (
            <div className={cn(
              'mb-3 px-3 py-2 rounded-lg flex items-center gap-2',
              isInjured || isUnavailable ? 'bg-red-500/20 text-red-300' :
              isSuspended ? 'bg-orange-500/20 text-orange-300' :
              'bg-yellow-500/20 text-yellow-300'
            )}>
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{player.news}</span>
              {player.chance_of_playing_next_round !== null && (
                <span className="ml-auto text-xs font-bold">
                  {player.chance_of_playing_next_round}% chance
                </span>
              )}
            </div>
          )}

          {/* Stats Breakdown */}
          {statsBreakdown.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {statsBreakdown.map((stat, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 rounded px-3 py-2">
                  <span className="text-sm text-white/70">{stat.label}</span>
                  <span className={cn(
                    'text-sm font-bold',
                    stat.points > 0 ? 'text-[var(--fpl-green)]' : stat.points < 0 ? 'text-red-400' : 'text-white'
                  )}>
                    {stat.points > 0 ? '+' : ''}{stat.points}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* No stats message */}
          {statsBreakdown.length === 0 && !hasIssue && (
            <p className="text-sm text-white/50 text-center">No stats yet</p>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Get stats breakdown for points display
 */
function getStatsBreakdown(stats, elementType) {
  if (!stats) return [];

  const breakdown = [];

  // Minutes played
  if (stats.minutes > 0) {
    const minPoints = stats.minutes >= 60 ? 2 : stats.minutes > 0 ? 1 : 0;
    breakdown.push({ label: `${stats.minutes} mins`, points: minPoints });
  }

  // Goals (points vary by position)
  if (stats.goals_scored > 0) {
    const goalPoints = elementType === 1 || elementType === 2 ? 6 : elementType === 3 ? 5 : 4;
    breakdown.push({ label: `${stats.goals_scored} goal${stats.goals_scored > 1 ? 's' : ''}`, points: stats.goals_scored * goalPoints });
  }

  // Assists
  if (stats.assists > 0) {
    breakdown.push({ label: `${stats.assists} assist${stats.assists > 1 ? 's' : ''}`, points: stats.assists * 3 });
  }

  // Clean sheet (GK/DEF only)
  if (stats.clean_sheets > 0 && (elementType === 1 || elementType === 2)) {
    breakdown.push({ label: 'Clean sheet', points: 4 });
  } else if (stats.clean_sheets > 0 && elementType === 3) {
    breakdown.push({ label: 'Clean sheet', points: 1 });
  }

  // Goals conceded (GK/DEF)
  if (stats.goals_conceded >= 2 && (elementType === 1 || elementType === 2)) {
    const gcPoints = -Math.floor(stats.goals_conceded / 2);
    breakdown.push({ label: `${stats.goals_conceded} conceded`, points: gcPoints });
  }

  // Saves (GK only)
  if (stats.saves > 0 && elementType === 1) {
    const savePoints = Math.floor(stats.saves / 3);
    if (savePoints > 0) {
      breakdown.push({ label: `${stats.saves} saves`, points: savePoints });
    }
  }

  // Penalties saved
  if (stats.penalties_saved > 0) {
    breakdown.push({ label: `${stats.penalties_saved} pen saved`, points: stats.penalties_saved * 5 });
  }

  // Penalties missed
  if (stats.penalties_missed > 0) {
    breakdown.push({ label: `${stats.penalties_missed} pen missed`, points: stats.penalties_missed * -2 });
  }

  // Own goals
  if (stats.own_goals > 0) {
    breakdown.push({ label: `${stats.own_goals} own goal${stats.own_goals > 1 ? 's' : ''}`, points: stats.own_goals * -2 });
  }

  // Yellow cards
  if (stats.yellow_cards > 0) {
    breakdown.push({ label: 'Yellow card', points: -1 });
  }

  // Red cards
  if (stats.red_cards > 0) {
    breakdown.push({ label: 'Red card', points: -3 });
  }

  // Bonus
  if (stats.bonus > 0) {
    breakdown.push({ label: 'Bonus', points: stats.bonus });
  }

  return breakdown;
}

/**
 * Differential player row component
 */
function DifferentialRow({ differential, teamMap, liveElementMap, fixtureByTeam }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { player, leagueOwnership, totalTeams, isUnique, isDifferential } = differential;

  if (!player) return null;

  const team = teamMap.get(player.team);
  const liveElement = liveElementMap.get(differential.element);
  const fixture = fixtureByTeam.get(player.team);
  const shirtUrl = team?.code ? getShirtUrl(team.code, player.element_type === 1) : null;

  const points = liveElement?.stats?.total_points ?? 0;
  const isPlaying = fixture?.started && !fixture?.finished;
  const isFinished = fixture?.finished || fixture?.finished_provisional;
  const liveStats = liveElement?.stats;

  // Player availability status
  const isInjured = player.status === 'i';
  const isDoubtful = player.status === 'd';
  const isSuspended = player.status === 's';
  const isUnavailable = player.status === 'u' || player.status === 'n';
  const hasIssue = isInjured || isDoubtful || isSuspended || isUnavailable;

  // Get stats breakdown for accordion
  const statsBreakdown = getStatsBreakdown(liveStats, player.element_type);

  // Determine badge color based on ownership
  const getBadgeStyle = () => {
    if (isUnique) return 'bg-[var(--fpl-pink)] text-white';
    if (isDifferential) return 'bg-[var(--fpl-cyan)] text-white';
    return 'bg-gray-200 text-gray-700';
  };

  const getBorderStyle = () => {
    if (isUnique) return 'border-l-[var(--fpl-pink)]';
    if (isDifferential) return 'border-l-[var(--fpl-cyan)]';
    return 'border-l-gray-300';
  };

  // Determine ring color based on status
  const getRingClass = () => {
    if (isInjured || isUnavailable) return 'ring-2 ring-red-500';
    if (isDoubtful) return 'ring-2 ring-yellow-500';
    if (isSuspended) return 'ring-2 ring-orange-500';
    return '';
  };

  return (
    <Card className={cn(
      'overflow-hidden border-l-4',
      getBorderStyle(),
      getRingClass()
    )}>
      <div
        className="flex items-center p-3 gap-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Ownership badge */}
        <div className="flex-shrink-0 min-w-[70px]">
          {isUnique ? (
            <span className={cn('px-2 py-1 text-xs font-bold rounded', getBadgeStyle())}>
              ONLY YOU
            </span>
          ) : (
            <span className={cn('px-2 py-1 text-xs font-bold rounded', getBadgeStyle())}>
              {leagueOwnership}/{totalTeams}
            </span>
          )}
        </div>

        {/* Jersey */}
        <div className="w-10 h-12 relative flex-shrink-0">
          {shirtUrl && (
            <Image
              src={shirtUrl}
              alt={team?.name ?? ''}
              width={40}
              height={48}
              className="object-contain"
              unoptimized
            />
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white truncate text-base">
              {player.web_name}
            </span>
            {differential.is_captain && (
              <span className="px-1.5 py-0.5 bg-[var(--fpl-purple)] text-white text-xs font-bold rounded">
                C
              </span>
            )}
          </div>
          <div className="text-sm text-white/80">
            {team?.short_name} • {player.selected_by_percent}% overall ownership
          </div>
        </div>

        {/* Status */}
        <div className={cn(
          'w-2 h-10 rounded-full flex-shrink-0',
          isPlaying ? 'bg-[var(--fpl-green)] animate-pulse' : isFinished ? 'bg-gray-400' : 'bg-gray-200'
        )} />

        {/* Points */}
        <div className={cn(
          'text-center px-3 py-2 rounded-lg flex-shrink-0 min-w-[50px]',
          points > 0 ? 'bg-[var(--fpl-green)]/10' : 'bg-gray-100'
        )}>
          <p className="text-xs text-gray-400">Pts</p>
          <p className={cn(
            'text-lg font-bold',
            points > 0 ? 'text-[var(--fpl-green)]' : 'text-gray-600'
          )}>
            {points}
          </p>
        </div>

        {/* Expand indicator */}
        <div className="flex-shrink-0">
          <svg
            className={cn('w-5 h-5 text-gray-400 transition-transform', isExpanded && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/10">
          {/* Player Status Alert */}
          {hasIssue && player.news && (
            <div className={cn(
              'mb-3 px-3 py-2 rounded-lg flex items-center gap-2',
              isInjured || isUnavailable ? 'bg-red-500/20 text-red-300' :
              isSuspended ? 'bg-orange-500/20 text-orange-300' :
              'bg-yellow-500/20 text-yellow-300'
            )}>
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{player.news}</span>
              {player.chance_of_playing_next_round !== null && (
                <span className="ml-auto text-xs font-bold">
                  {player.chance_of_playing_next_round}% chance
                </span>
              )}
            </div>
          )}

          {/* Stats Breakdown */}
          {statsBreakdown.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {statsBreakdown.map((stat, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 rounded px-3 py-2">
                  <span className="text-sm text-white/70">{stat.label}</span>
                  <span className={cn(
                    'text-sm font-bold',
                    stat.points > 0 ? 'text-[var(--fpl-green)]' : stat.points < 0 ? 'text-red-400' : 'text-white'
                  )}>
                    {stat.points > 0 ? '+' : ''}{stat.points}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* No stats message */}
          {statsBreakdown.length === 0 && !hasIssue && (
            <p className="text-sm text-white/50 text-center">No stats yet</p>
          )}
        </div>
      )}
    </Card>
  );
}
