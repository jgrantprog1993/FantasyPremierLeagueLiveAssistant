'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { useBootstrap, createTeamMap, useFixtures } from '@/hooks/useBootstrap';
import { useLiveData } from '@/hooks/useLiveData';
import { cn } from '@/lib/utils/cn';

export default function FixturesPage() {
  return (
    <Suspense fallback={<FixturesSkeleton />}>
      <FixturesContent />
    </Suspense>
  );
}

function FixturesSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="max-w-5xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-[var(--border)] rounded w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-24 bg-[var(--border)] rounded"></div>
          <div className="h-24 bg-[var(--border)] rounded"></div>
          <div className="h-24 bg-[var(--border)] rounded"></div>
          <div className="h-24 bg-[var(--border)] rounded"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-48 bg-[var(--border)] rounded"></div>
          <div className="h-48 bg-[var(--border)] rounded"></div>
        </div>
      </div>
    </div>
  );
}

function FixturesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showTeamEntry = searchParams.get('change') === 'true';

  const [teamId, setTeamId] = useState('');

  // Fetch bootstrap data
  const { data: bootstrap, isLoading: bootstrapLoading } = useBootstrap();

  // Get current and next gameweek
  const currentGw = bootstrap?.events?.find(e => e.is_current);
  const nextGw = bootstrap?.events?.find(e => e.is_next);

  // Fetch fixtures for current gameweek
  const { data: currentFixtures } = useFixtures(currentGw?.id);

  // Fetch live data
  const { data: liveData, dataUpdatedAt } = useLiveData(currentGw?.id);

  // Create team map
  const teamMap = useMemo(() => createTeamMap(bootstrap?.teams), [bootstrap?.teams]);

  // Categorize fixtures
  const { liveFixtures, completedFixtures, upcomingFixtures } = useMemo(() => {
    if (!currentFixtures) return { liveFixtures: [], completedFixtures: [], upcomingFixtures: [] };

    const live = currentFixtures.filter(f => f.started && !f.finished && !f.finished_provisional);
    const completed = currentFixtures.filter(f => f.finished || f.finished_provisional);
    const upcoming = currentFixtures.filter(f => !f.started);

    return { liveFixtures: live, completedFixtures: completed, upcomingFixtures: upcoming };
  }, [currentFixtures]);

  // Get top performers from live data
  const topPerformers = useMemo(() => {
    if (!liveData?.elements || !bootstrap?.elements) return [];

    const playerMap = new Map(bootstrap.elements.map(p => [p.id, p]));

    return liveData.elements
      .filter(e => e.stats?.total_points > 0)
      .sort((a, b) => (b.stats?.total_points ?? 0) - (a.stats?.total_points ?? 0))
      .slice(0, 5)
      .map(e => ({
        ...e,
        player: playerMap.get(e.id),
        team: teamMap.get(playerMap.get(e.id)?.team),
      }));
  }, [liveData, bootstrap, teamMap]);

  // Format last updated time
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  const handleTeamSubmit = (e) => {
    e.preventDefault();
    if (teamId) {
      router.push(`/team/${teamId}`);
    }
  };

  if (bootstrapLoading) {
    return <FixturesSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--fpl-purple)] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Gameweek {currentGw?.id}
              </h1>
              <p className="text-white/60 mt-1">
                {currentGw?.name}
              </p>
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
        {/* Team ID Entry Card - shown when ?change=true */}
        {showTeamEntry && (
          <Card className="max-w-md mx-auto mb-8 ring-2 ring-[var(--fpl-green)]">
            <CardContent className="py-6">
              <h2 className="text-lg font-semibold mb-4 text-center text-white">Enter Team ID</h2>
              <form onSubmit={handleTeamSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  placeholder="e.g. 123456"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fpl-purple)] text-gray-900"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-[var(--fpl-green)] text-white rounded-lg hover:bg-[var(--fpl-green)]/80 transition-colors font-medium"
                >
                  Go
                </button>
              </form>
              <p className="text-xs text-white/50 text-center mt-3">
                Find your Team ID in your FPL URL: fantasy.premierleague.com/entry/<strong>123456</strong>/event/1
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-xs text-[var(--muted)] uppercase">Live Matches</p>
              <p className="text-3xl font-bold text-[var(--fpl-green)]">{liveFixtures.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-xs text-[var(--muted)] uppercase">Completed</p>
              <p className="text-3xl font-bold text-gray-500">{completedFixtures.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-xs text-[var(--muted)] uppercase">Upcoming</p>
              <p className="text-3xl font-bold">{upcomingFixtures.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-xs text-[var(--muted)] uppercase">GW Average</p>
              <p className="text-3xl font-bold text-[var(--fpl-purple)]">
                {currentGw?.average_entry_score || '-'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live Fixtures */}
        {liveFixtures.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[var(--fpl-green)] animate-pulse"></div>
              <h2 className="text-lg font-semibold">Live Now</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {liveFixtures.map((fixture) => (
                <FixtureCard key={fixture.id} fixture={fixture} teamMap={teamMap} isLive />
              ))}
            </div>
          </div>
        )}

        {/* Completed Fixtures */}
        {completedFixtures.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Completed</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedFixtures.map((fixture) => (
                <FixtureCard key={fixture.id} fixture={fixture} teamMap={teamMap} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Fixtures */}
        {upcomingFixtures.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingFixtures.map((fixture) => (
                <FixtureCard key={fixture.id} fixture={fixture} teamMap={teamMap} isUpcoming />
              ))}
            </div>
          </div>
        )}

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Top Performers This GW</h2>
            <Card>
              <div className="divide-y divide-white/10">
                {topPerformers.map((performer, idx) => (
                  <div key={performer.id} className="flex items-center p-4 gap-4">
                    <span className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                      idx === 0 ? 'bg-yellow-500 text-white' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      idx === 2 ? 'bg-amber-600 text-white' :
                      'bg-white/10 text-white'
                    )}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{performer.player?.web_name}</p>
                      <p className="text-sm text-white/60">{performer.team?.short_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[var(--fpl-green)]">
                        {performer.stats?.total_points}
                      </p>
                      <p className="text-xs text-white/50">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Gameweek Info */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Current GW Stats */}
          <Card>
            <CardContent className="py-4">
              <h3 className="font-semibold mb-4 text-white">Gameweek {currentGw?.id} Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Average Score</span>
                  <span className="font-medium text-white">{currentGw?.average_entry_score || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Highest Score</span>
                  <span className="font-medium text-[var(--fpl-green)]">{currentGw?.highest_score || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Most Captained</span>
                  <span className="font-medium text-white">
                    {bootstrap?.elements?.find(e => e.id === currentGw?.most_captained)?.web_name || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Most Transferred In</span>
                  <span className="font-medium text-white">
                    {bootstrap?.elements?.find(e => e.id === currentGw?.most_transferred_in)?.web_name || '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next GW Info */}
          {nextGw && (
            <Card>
              <CardContent className="py-4">
                <h3 className="font-semibold mb-4 text-white">Next: Gameweek {nextGw.id}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">Deadline</span>
                    <span className="font-medium text-white">
                      {new Date(nextGw.deadline_time).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Transfers Made</span>
                    <span className="font-medium text-white">{nextGw.transfers_made?.toLocaleString() || '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* FPL Season Stats */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Season Overview</h2>
          <Card>
            <CardContent className="py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-[var(--fpl-purple)]">
                    {bootstrap?.total_players?.toLocaleString() || '11M+'}
                  </p>
                  <p className="text-sm text-white/60">Managers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--fpl-green)]">
                    {currentGw?.id || '-'}/38
                  </p>
                  <p className="text-sm text-white/60">Gameweeks</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--fpl-cyan)]">
                    {bootstrap?.elements?.length || '600+'}
                  </p>
                  <p className="text-sm text-white/60">Players</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--fpl-pink)]">
                    {bootstrap?.teams?.length || '20'}
                  </p>
                  <p className="text-sm text-white/60">Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function FixtureCard({ fixture, teamMap, isLive, isUpcoming }) {
  const homeTeam = teamMap.get(fixture.team_h);
  const awayTeam = teamMap.get(fixture.team_a);

  const kickoffTime = new Date(fixture.kickoff_time);
  const timeString = kickoffTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateString = kickoffTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <Card className={cn(
      'overflow-hidden',
      isLive && 'ring-2 ring-[var(--fpl-green)]'
    )}>
      <CardContent className="py-4">
        {/* Live indicator */}
        {isLive && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[var(--fpl-green)] animate-pulse"></div>
            <span className="text-xs font-medium text-[var(--fpl-green)] uppercase">Live</span>
            <span className="text-xs text-white/50 ml-auto">{fixture.minutes}'</span>
          </div>
        )}

        {/* Teams and Score */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center">
              {homeTeam?.code && (
                <Image
                  src={`https://resources.premierleague.com/premierleague/badges/25/t${homeTeam.code}.png`}
                  alt={homeTeam.name}
                  width={24}
                  height={24}
                  unoptimized
                />
              )}
            </div>
            <p className="font-medium text-white text-sm">{homeTeam?.short_name}</p>
          </div>

          {/* Score */}
          <div className="px-4 text-center">
            {isUpcoming ? (
              <div>
                <p className="text-lg font-medium text-white/60">{timeString}</p>
                <p className="text-xs text-white/40">{dateString}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-3xl font-bold',
                  isLive ? 'text-[var(--fpl-green)]' : 'text-white'
                )}>
                  {fixture.team_h_score ?? 0}
                </span>
                <span className="text-white/40">-</span>
                <span className={cn(
                  'text-3xl font-bold',
                  isLive ? 'text-[var(--fpl-green)]' : 'text-white'
                )}>
                  {fixture.team_a_score ?? 0}
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center">
              {awayTeam?.code && (
                <Image
                  src={`https://resources.premierleague.com/premierleague/badges/25/t${awayTeam.code}.png`}
                  alt={awayTeam.name}
                  width={24}
                  height={24}
                  unoptimized
                />
              )}
            </div>
            <p className="font-medium text-white text-sm">{awayTeam?.short_name}</p>
          </div>
        </div>

        {/* Finished indicator */}
        {!isLive && !isUpcoming && (
          <p className="text-xs text-center text-white/40 mt-3">Full Time</p>
        )}
      </CardContent>
    </Card>
  );
}
