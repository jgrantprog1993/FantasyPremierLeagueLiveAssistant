'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { useBootstrap, createTeamMap, createPlayerMap, useFixtures } from '@/hooks/useBootstrap';
import { useLiveData } from '@/hooks/useLiveData';
import { cn } from '@/lib/utils/cn';
import { getShirtUrl } from '@/lib/fpl/endpoints';

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

  // Create player map for fixture stats
  const playerMap = useMemo(() => createPlayerMap(bootstrap?.elements), [bootstrap?.elements]);

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
              <p className="text-3xl font-bold text-white">
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
            <div className="flex flex-col gap-3">
              {liveFixtures.map((fixture) => (
                <FixtureCard key={fixture.id} fixture={fixture} teamMap={teamMap} playerMap={playerMap} isLive />
              ))}
            </div>
          </div>
        )}

        {/* Completed Fixtures */}
        {completedFixtures.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Completed</h2>
            <div className="flex flex-col gap-3">
              {completedFixtures.map((fixture) => (
                <FixtureCard key={fixture.id} fixture={fixture} teamMap={teamMap} playerMap={playerMap} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Fixtures */}
        {upcomingFixtures.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
            <div className="flex flex-col gap-3">
              {upcomingFixtures.map((fixture) => (
                <FixtureCard key={fixture.id} fixture={fixture} teamMap={teamMap} playerMap={playerMap} isUpcoming />
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
                {topPerformers.map((performer, idx) => {
                  const isGoalkeeper = performer.player?.element_type === 1;
                  return (
                    <div key={performer.id} className="flex items-center p-3 gap-3">
                      <span className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs',
                        idx === 0 ? 'bg-yellow-500 text-white' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-amber-600 text-white' :
                        'bg-white/10 text-white'
                      )}>
                        {idx + 1}
                      </span>
                      <div className="w-8 h-10 flex-shrink-0">
                        <Image
                          src={getShirtUrl(performer.team?.code, isGoalkeeper)}
                          alt={performer.team?.short_name || ''}
                          width={32}
                          height={40}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{performer.player?.web_name}</p>
                        <p className="text-xs text-white/60">{performer.team?.short_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[var(--fpl-green)]">
                          {performer.stats?.total_points}
                        </p>
                        <p className="text-xs text-white/50">pts</p>
                      </div>
                    </div>
                  );
                })}
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
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Highest Score</span>
                  {currentGw?.highest_scoring_entry ? (
                    <Link
                      href={`/team/${currentGw.highest_scoring_entry}`}
                      className="font-medium text-[var(--fpl-green)] hover:underline flex items-center gap-1"
                    >
                      {currentGw?.highest_score || '-'}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  ) : (
                    <span className="font-medium text-[var(--fpl-green)]">{currentGw?.highest_score || '-'}</span>
                  )}
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
                  <p className="text-3xl font-bold text-white">
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

function FixtureCard({ fixture, teamMap, playerMap, isLive, isUpcoming }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const homeTeam = teamMap.get(fixture.team_h);
  const awayTeam = teamMap.get(fixture.team_a);

  const kickoffTime = new Date(fixture.kickoff_time);
  const timeString = kickoffTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateString = kickoffTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  // Parse fixture stats
  const stats = fixture.stats || [];
  const getStatByIdentifier = (identifier) => stats.find(s => s.identifier === identifier);

  const goals = getStatByIdentifier('goals_scored');
  const assists = getStatByIdentifier('assists');
  const ownGoals = getStatByIdentifier('own_goals');
  const penaltiesSaved = getStatByIdentifier('penalties_saved');
  const penaltiesMissed = getStatByIdentifier('penalties_missed');
  const yellowCards = getStatByIdentifier('yellow_cards');
  const redCards = getStatByIdentifier('red_cards');
  const saves = getStatByIdentifier('saves');
  const bonus = getStatByIdentifier('bonus');
  const bps = getStatByIdentifier('bps');

  const hasStats = fixture.started && (goals?.h?.length > 0 || goals?.a?.length > 0 || bonus?.h?.length > 0);
  const canExpand = !isUpcoming && hasStats;

  const handleClick = () => {
    if (canExpand) {
      setIsExpanded(!isExpanded);
    }
  };

  // Helper to render player stat
  const renderPlayerStat = (statData, side, icon, label, colorClass = 'text-white') => {
    const players = statData?.[side] || [];
    if (players.length === 0) return null;

    return players.map((p, idx) => {
      const player = playerMap?.get(p.element);
      return (
        <div key={`${p.element}-${idx}`} className="flex items-center gap-2 text-sm">
          <span className={colorClass}>{icon}</span>
          <span className="text-white/80">{player?.web_name || `Player ${p.element}`}</span>
          {p.value > 1 && <span className="text-white/50">x{p.value}</span>}
        </div>
      );
    });
  };

  return (
    <Card className={cn(
      'overflow-hidden transition-all',
      isLive && 'ring-2 ring-[var(--fpl-green)]',
      canExpand && 'cursor-pointer hover:bg-white/5'
    )}>
      <div onClick={handleClick}>
        <CardContent className="py-2 px-3">
          {/* Teams and Score */}
          <div className="flex items-center justify-between">
            {/* Home Team */}
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                {homeTeam?.code && (
                  <Image
                    src={`https://resources.premierleague.com/premierleague/badges/25/t${homeTeam.code}.png`}
                    alt={homeTeam.name}
                    width={18}
                    height={18}
                    unoptimized
                  />
                )}
              </div>
              <p className="font-medium text-white text-sm">{homeTeam?.short_name}</p>
            </div>

            {/* Score / Time */}
            <div className="px-4 text-center flex items-center gap-2">
              {isLive && (
                <div className="flex items-center gap-1 mr-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--fpl-green)] animate-pulse"></div>
                  <span className="text-xs text-white/50">{fixture.minutes}'</span>
                </div>
              )}
              {isUpcoming ? (
                <div>
                  <p className="text-sm font-medium text-white/60">{timeString}</p>
                  <p className="text-xs text-white/40">{dateString}</p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'text-xl font-bold',
                    isLive ? 'text-[var(--fpl-green)]' : 'text-white'
                  )}>
                    {fixture.team_h_score ?? 0}
                  </span>
                  <span className="text-white/40">-</span>
                  <span className={cn(
                    'text-xl font-bold',
                    isLive ? 'text-[var(--fpl-green)]' : 'text-white'
                  )}>
                    {fixture.team_a_score ?? 0}
                  </span>
                </div>
              )}
              {canExpand && (
                <svg
                  className={cn(
                    'w-4 h-4 text-white/40 transition-transform ml-1',
                    isExpanded && 'rotate-180'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <p className="font-medium text-white text-sm">{awayTeam?.short_name}</p>
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                {awayTeam?.code && (
                  <Image
                    src={`https://resources.premierleague.com/premierleague/badges/25/t${awayTeam.code}.png`}
                    alt={awayTeam.name}
                    width={18}
                    height={18}
                    unoptimized
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Expanded Stats */}
      {isExpanded && (
        <div className="border-t border-white/10 px-4 py-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Home Team Stats */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/60 uppercase">{homeTeam?.short_name}</p>

              {/* Goals */}
              {goals?.h?.length > 0 && (
                <div className="space-y-1">
                  {renderPlayerStat(goals, 'h', '⚽', 'Goal', 'text-[var(--fpl-green)]')}
                </div>
              )}

              {/* Assists */}
              {assists?.h?.length > 0 && (
                <div className="space-y-1">
                  {renderPlayerStat(assists, 'h', '🅰️', 'Assist', 'text-[var(--fpl-cyan)]')}
                </div>
              )}

              {/* Own Goals */}
              {ownGoals?.h?.length > 0 && (
                <div className="space-y-1">
                  {renderPlayerStat(ownGoals, 'h', '🔴', 'OG', 'text-red-400')}
                </div>
              )}

              {/* Yellow Cards */}
              {yellowCards?.h?.length > 0 && (
                <div className="space-y-1">
                  {renderPlayerStat(yellowCards, 'h', '🟨', 'Yellow', 'text-yellow-400')}
                </div>
              )}

              {/* Red Cards */}
              {redCards?.h?.length > 0 && (
                <div className="space-y-1">
                  {renderPlayerStat(redCards, 'h', '🟥', 'Red', 'text-red-500')}
                </div>
              )}

              {/* Penalties Saved */}
              {penaltiesSaved?.h?.length > 0 && (
                <div className="space-y-1">
                  {renderPlayerStat(penaltiesSaved, 'h', '🧤', 'Pen Saved', 'text-[var(--fpl-green)]')}
                </div>
              )}

              {/* Saves (top 3) */}
              {saves?.h?.length > 0 && (
                <div className="space-y-1">
                  {saves.h.slice(0, 3).map((p, idx) => {
                    const player = playerMap?.get(p.element);
                    return (
                      <div key={`save-h-${idx}`} className="flex items-center gap-2 text-sm">
                        <span className="text-blue-400">🧤</span>
                        <span className="text-white/80">{player?.web_name}</span>
                        <span className="text-white/50">{p.value} saves</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Away Team Stats */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/60 uppercase">{awayTeam?.short_name}</p>

              {/* Goals */}
              {goals?.a?.length > 0 && (
                <div className="space-y-1">
                  {renderPlayerStat(goals, 'a', '⚽', 'Goal', 'text-[var(--fpl-green)]')}
                </div>
              )}

              {/* Assists */}
              {assists?.a?.length > 0 && (
                <div className="space-y-1">
                  {renderPlayerStat(assists, 'a', '🅰️', 'Assist', 'text-[var(--fpl-cyan)]')}
                </div>
              )}

              {/* Own Goals */}
              {ownGoals?.a?.length > 0 && (
                <div className="space-y-1">
                  {renderPlayerStat(ownGoals, 'a', '🔴', 'OG', 'text-red-400')}
                </div>
              )}

              {/* Yellow Cards */}
              {yellowCards?.a?.length > 0 && (
                <div className="space-y-1">
                  {renderPlayerStat(yellowCards, 'a', '🟨', 'Yellow', 'text-yellow-400')}
                </div>
              )}

              {/* Red Cards */}
              {redCards?.a?.length > 0 && (
                <div className="space-y-1">
                  {renderPlayerStat(redCards, 'a', '🟥', 'Red', 'text-red-500')}
                </div>
              )}

              {/* Penalties Saved */}
              {penaltiesSaved?.a?.length > 0 && (
                <div className="space-y-1">
                  {renderPlayerStat(penaltiesSaved, 'a', '🧤', 'Pen Saved', 'text-[var(--fpl-green)]')}
                </div>
              )}

              {/* Saves (top 3) */}
              {saves?.a?.length > 0 && (
                <div className="space-y-1">
                  {saves.a.slice(0, 3).map((p, idx) => {
                    const player = playerMap?.get(p.element);
                    return (
                      <div key={`save-a-${idx}`} className="flex items-center gap-2 text-sm">
                        <span className="text-blue-400">🧤</span>
                        <span className="text-white/80">{player?.web_name}</span>
                        <span className="text-white/50">{p.value} saves</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bonus Points */}
          {bonus?.h?.length > 0 || bonus?.a?.length > 0 ? (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs font-semibold text-white/60 uppercase mb-2">Bonus Points</p>
              <div className="flex flex-wrap gap-3">
                {[...(bonus?.h || []), ...(bonus?.a || [])]
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 3)
                  .map((p, idx) => {
                    const player = playerMap?.get(p.element);
                    return (
                      <div
                        key={`bonus-${p.element}`}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-full',
                          idx === 0 ? 'bg-yellow-500/20' : 'bg-white/10'
                        )}
                      >
                        <span className={cn(
                          'font-bold',
                          idx === 0 ? 'text-yellow-400' : 'text-white'
                        )}>
                          +{p.value}
                        </span>
                        <span className="text-white/80 text-sm">{player?.web_name}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : null}

          {/* BPS Leaders */}
          {bps?.h?.length > 0 || bps?.a?.length > 0 ? (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs font-semibold text-white/60 uppercase mb-2">BPS Leaders</p>
              <div className="flex flex-wrap gap-2">
                {[...(bps?.h || []), ...(bps?.a || [])]
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)
                  .map((p, idx) => {
                    const player = playerMap?.get(p.element);
                    return (
                      <div
                        key={`bps-${p.element}`}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-sm"
                      >
                        <span className="text-white/50">{p.value}</span>
                        <span className="text-white/80">{player?.web_name}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
