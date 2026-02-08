'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { useTeamEntry, useTeamPicks } from '@/hooks/useTeam';
import { useBootstrap, createPlayerMap, createTeamMap, useFixtures } from '@/hooks/useBootstrap';
import { useLiveData } from '@/hooks/useLiveData';
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

  // Create lookup maps
  const playerMap = useMemo(() => createPlayerMap(bootstrap?.elements), [bootstrap?.elements]);
  const teamMap = useMemo(() => createTeamMap(bootstrap?.teams), [bootstrap?.teams]);

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
                  <PlayerRow key={pick.element} pick={pick} />
                ))}
              </div>
            </div>

            {/* Bench */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-500">Bench</h2>
              <div className="space-y-2 opacity-60">
                {bench.map((pick) => (
                  <PlayerRow key={pick.element} pick={pick} isBench />
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
function PlayerRow({ pick, isBench = false }) {
  const { player, team, fixture, points, basePoints, bonus, bps, provisionalBonus, isPlaying, isFinished } = pick;

  if (!player) return null;

  const shirtUrl = team?.code ? getShirtUrl(team.code, player.element_type === 1) : null;

  // Format fixture score
  const getFixtureDisplay = () => {
    if (!fixture) return null;

    const homeTeam = fixture.team_h === player.team;
    const opponent = homeTeam ? fixture.team_a : fixture.team_h;
    const homeScore = fixture.team_h_score ?? 0;
    const awayScore = fixture.team_a_score ?? 0;
    const score = `${homeScore}-${awayScore}`;

    return {
      opponent,
      score: fixture.started ? score : null,
      isHome: homeTeam,
    };
  };

  const fixtureInfo = getFixtureDisplay();

  return (
    <Card className={cn(
      'overflow-hidden transition-all',
      isPlaying && 'ring-2 ring-[var(--fpl-green)]',
      isFinished && 'opacity-70'
    )}>
      <div className="flex items-center p-3 gap-3">
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
            <span className="font-medium text-gray-800 truncate">
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
          <div className="text-xs text-gray-500 flex items-center gap-2">
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
      </div>
    </Card>
  );
}
