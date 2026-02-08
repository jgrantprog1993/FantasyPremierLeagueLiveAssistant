'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { useTeamEntry } from '@/hooks/useTeam';
import { useBootstrap } from '@/hooks/useBootstrap';
import { useLeagueStandings } from '@/hooks/useLeague';
import { cn } from '@/lib/utils/cn';

export default function LeaguesPage() {
  return (
    <Suspense fallback={<LeaguesSkeleton />}>
      <LeaguesContent />
    </Suspense>
  );
}

function LeaguesSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-[var(--border)] rounded w-1/3"></div>
        <div className="h-64 bg-[var(--border)] rounded"></div>
      </div>
    </div>
  );
}

function LeaguesContent() {
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

  // Fetch selected league standings
  const { data: leagueData, isLoading: leagueLoading } = useLeagueStandings(selectedLeagueId);

  // Get user's classic leagues
  // Only show private leagues (exclude public leagues like "All Ireland", "Liverpool Fans", etc.)
  const userLeagues = team?.leagues?.classic?.filter(l => l.league_type === 'x') || [];

  // Find user's position in selected league
  const userPosition = leagueData?.standings?.results?.find(r => r.entry === parseInt(submittedTeamId));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedTeamId(teamId);
    setSelectedLeagueId(null);
  };

  const isLoading = bootstrapLoading;

  if (isLoading) {
    return <LeaguesSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--fpl-purple)] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span>Leagues</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Mini-League Standings
          </h1>
          {team && (
            <p className="text-[var(--fpl-green)] mt-1">{team.name}</p>
          )}
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
                  View
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
        {submittedTeamId && teamLoading && !teamError && (
          <div className="max-w-4xl mx-auto animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-24 bg-[var(--border)] rounded"></div>
              ))}
            </div>
          </div>
        )}

        {/* League Selection */}
        {team && !teamError && (
          <>
            {/* League Cards */}
            {!selectedLeagueId && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Your Leagues</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userLeagues.map((league) => (
                    <Card
                      key={league.id}
                      className="cursor-pointer hover:ring-2 hover:ring-[var(--fpl-purple)] transition-all"
                      onClick={() => setSelectedLeagueId(league.id)}
                    >
                      <CardContent className="py-4">
                        <h3 className="font-bold text-white truncate">{league.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-white/60">
                            Your Rank
                          </span>
                          <span className="text-xl font-bold text-[var(--fpl-green)]">
                            {league.entry_rank?.toLocaleString() || '-'}
                          </span>
                        </div>
                        {league.entry_last_rank && league.entry_rank !== league.entry_last_rank && (
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {league.entry_rank < league.entry_last_rank ? (
                              <span className="text-xs text-green-400">
                                ▲ {league.entry_last_rank - league.entry_rank}
                              </span>
                            ) : (
                              <span className="text-xs text-red-400">
                                ▼ {league.entry_rank - league.entry_last_rank}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {userLeagues.length === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      <p>No classic leagues found</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* League Standings Table */}
            {selectedLeagueId && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <button
                      onClick={() => setSelectedLeagueId(null)}
                      className="text-sm text-[var(--fpl-purple)] hover:underline mb-2 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to leagues
                    </button>
                    <h2 className="text-lg font-semibold">
                      {leagueData?.league?.name || 'Loading...'}
                    </h2>
                  </div>
                  {userPosition && (
                    <div className="text-right">
                      <p className="text-sm text-white/60">Your Position</p>
                      <p className="text-2xl font-bold text-[var(--fpl-green)]">
                        {userPosition.rank}
                      </p>
                    </div>
                  )}
                </div>

                {leagueLoading && (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-14 bg-[var(--border)] rounded"></div>
                    ))}
                  </div>
                )}

                {!leagueLoading && leagueData?.standings?.results && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-2 text-sm text-white/60 font-medium">Rank</th>
                          <th className="text-left py-3 px-2 text-sm text-white/60 font-medium">Team</th>
                          <th className="text-right py-3 px-2 text-sm text-white/60 font-medium">GW{currentGw}</th>
                          <th className="text-right py-3 px-2 text-sm text-white/60 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leagueData.standings.results.map((entry) => {
                          const isCurrentUser = entry.entry === parseInt(submittedTeamId);
                          const rankChange = entry.last_rank ? entry.last_rank - entry.rank : 0;

                          return (
                            <tr
                              key={entry.id}
                              className={cn(
                                'border-b border-white/5 hover:bg-white/5 transition-colors',
                                isCurrentUser && 'bg-[var(--fpl-purple)]/20'
                              )}
                            >
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    'font-bold',
                                    entry.rank <= 3 ? 'text-[var(--fpl-green)]' : 'text-white'
                                  )}>
                                    {entry.rank}
                                  </span>
                                  {rankChange !== 0 && (
                                    <span className={cn(
                                      'text-xs',
                                      rankChange > 0 ? 'text-green-400' : 'text-red-400'
                                    )}>
                                      {rankChange > 0 ? `▲${rankChange}` : `▼${Math.abs(rankChange)}`}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <Link
                                  href={`/team/${entry.entry}`}
                                  className="hover:text-[var(--fpl-green)] transition-colors"
                                >
                                  <p className={cn(
                                    'font-medium truncate max-w-[200px]',
                                    isCurrentUser ? 'text-[var(--fpl-green)]' : 'text-white'
                                  )}>
                                    {entry.entry_name}
                                  </p>
                                  <p className="text-xs text-white/50">{entry.player_name}</p>
                                </Link>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <span className="text-white/80">{entry.event_total}</span>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <span className="font-bold text-white">{entry.total}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Pagination info */}
                    {leagueData.standings.has_next && (
                      <p className="text-center text-sm text-white/50 mt-4">
                        Showing top {leagueData.standings.results.length} managers
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </main>
    </div>
  );
}
