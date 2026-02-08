'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { TeamPitch, TeamPitchSkeleton } from '@/components/features/team/TeamPitch';
import { GameweekPicker, GameweekPickerCompact } from '@/components/features/gameweek/GameweekPicker';
import { useTeamEntry, useTeamPicks, useTeamHistory } from '@/hooks/useTeam';
import { useBootstrap, createPlayerMap, createTeamMap, useFixtures } from '@/hooks/useBootstrap';
import { useLiveData } from '@/hooks/useLiveData';

export default function TeamPage() {
  const params = useParams();
  const teamId = params.teamId;

  // Selected gameweek state
  const [selectedGw, setSelectedGw] = useState(null);

  // Fetch team entry data
  const {
    data: team,
    isLoading: teamLoading,
    error: teamError,
  } = useTeamEntry(teamId);

  // Fetch bootstrap data for player/team lookups
  const {
    data: bootstrap,
    isLoading: bootstrapLoading,
  } = useBootstrap();

  // Fetch team history for gameweek data
  const { data: history } = useTeamHistory(teamId);

  // Determine current gameweek and valid range
  const currentGw = team?.current_event ?? bootstrap?.events?.find(e => e.is_current)?.id ?? 1;
  const startedGw = team?.started_event ?? 1;
  const maxGw = currentGw;

  // Initialize selected gameweek to current when data loads
  useEffect(() => {
    if (currentGw && selectedGw === null) {
      setSelectedGw(currentGw);
    }
  }, [currentGw, selectedGw]);

  // Use selected gameweek for data fetching (fallback to current)
  const activeGw = selectedGw ?? currentGw;
  const isViewingCurrentGw = activeGw === currentGw;

  // Fetch picks for selected gameweek
  const {
    data: picksData,
    isLoading: picksLoading,
  } = useTeamPicks(teamId, activeGw);

  // Fetch live data for selected gameweek (works for historical gameweeks too)
  const {
    data: liveData,
  } = useLiveData(activeGw);

  // Fetch fixtures for selected gameweek
  const { data: fixtures } = useFixtures(activeGw);

  // Create lookup maps
  const playerMap = useMemo(() => {
    return createPlayerMap(bootstrap?.elements);
  }, [bootstrap?.elements]);

  const teamMap = useMemo(() => {
    return createTeamMap(bootstrap?.teams);
  }, [bootstrap?.teams]);

  // Get chip used in selected gameweek
  const activeChip = picksData?.active_chip;

  // Get gameweek data from history
  const gwHistoryData = history?.current ?? [];
  const selectedGwHistory = gwHistoryData.find(h => h.event === activeGw);

  // Calculate points from live data (works for any gameweek)
  const calculatedPoints = useMemo(() => {
    if (!picksData?.picks || !liveData?.elements) return null;

    const liveMap = new Map(liveData.elements.map(e => [e.id, e.stats?.total_points ?? 0]));
    let total = 0;

    picksData.picks.forEach(pick => {
      if (pick.position <= 11) {
        const points = liveMap.get(pick.element) ?? 0;
        total += pick.is_captain ? points * (pick.multiplier ?? 2) : points;
      }
    });

    return total;
  }, [picksData, liveData]);

  // Points to display - use calculated points, fall back to history
  const displayPoints = calculatedPoints ?? selectedGwHistory?.points ?? (isViewingCurrentGw ? team?.summary_event_points : 0) ?? 0;

  const isLoading = teamLoading || bootstrapLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--border)] rounded w-1/3"></div>
            <div className="h-4 bg-[var(--border)] rounded w-1/2"></div>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="h-24 bg-[var(--border)] rounded"></div>
              <div className="h-24 bg-[var(--border)] rounded"></div>
              <div className="h-24 bg-[var(--border)] rounded"></div>
            </div>
            <TeamPitchSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (teamError) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Card className="border-red-500">
            <CardContent className="py-8 text-center">
              <p className="text-red-500 font-medium">
                Failed to load team. Please check the Team ID and try again.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 text-[var(--fpl-purple)] hover:underline"
              >
                &larr; Back to Home
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--fpl-purple)] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <span>Team</span>
            </div>
            {/* Mobile gameweek picker */}
            <div className="md:hidden">
              <GameweekPickerCompact
                selectedGw={activeGw}
                currentGw={currentGw}
                minGw={startedGw}
                maxGw={maxGw}
                onSelect={setSelectedGw}
              />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {team.name}
          </h1>
          <p className="text-[var(--fpl-green)] mt-1">
            {team.player_first_name} {team.player_last_name}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Overall Rank */}
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Overall Rank</p>
              <p className="text-2xl font-bold text-[var(--fpl-purple)]">
                {team.summary_overall_rank?.toLocaleString() || '-'}
              </p>
            </CardContent>
          </Card>

          {/* Total Points */}
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Total Points</p>
              <p className="text-2xl font-bold">
                {team.summary_overall_points?.toLocaleString() || 0}
              </p>
            </CardContent>
          </Card>

          {/* Gameweek Points */}
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-[var(--muted)] uppercase tracking-wide">
                GW{activeGw} Points
              </p>
              <p className="text-2xl font-bold text-[var(--fpl-green)]">
                {displayPoints}
              </p>
              {activeChip && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--fpl-pink)] text-white text-xs rounded">
                  {activeChip.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </CardContent>
          </Card>

          {/* GW Rank or Team Value */}
          <Card>
            <CardContent className="py-4">
              {selectedGwHistory?.rank ? (
                <>
                  <p className="text-xs text-[var(--muted)] uppercase tracking-wide">GW{activeGw} Rank</p>
                  <p className="text-2xl font-bold">
                    {selectedGwHistory.rank.toLocaleString()}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Team Value</p>
                  <p className="text-2xl font-bold">
                    £{(team.last_deadline_value / 10).toFixed(1)}m
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Bank: £{(team.last_deadline_bank / 10).toFixed(1)}m
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Pitch Section */}
        <div className="mb-8">
          {/* Desktop gameweek picker */}
          <div className="hidden md:flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Gameweek {activeGw} Squad
              {!isViewingCurrentGw && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Historical)
                </span>
              )}
            </h2>
            <GameweekPicker
              selectedGw={activeGw}
              currentGw={currentGw}
              minGw={startedGw}
              maxGw={maxGw}
              gameweekHistory={gwHistoryData}
              onSelect={setSelectedGw}
              activeChip={activeChip}
            />
          </div>

          {/* Mobile header */}
          <div className="md:hidden mb-4">
            <h2 className="text-lg font-semibold">
              Gameweek {activeGw} Squad
              {!isViewingCurrentGw && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Historical)
                </span>
              )}
            </h2>
          </div>

          {picksLoading ? (
            <TeamPitchSkeleton />
          ) : picksData?.picks ? (
            <TeamPitch
              picks={picksData.picks}
              playerMap={playerMap}
              teamMap={teamMap}
              liveData={liveData}
              fixtures={fixtures}
            />
          ) : (
            <div className="pitch-bg rounded-lg p-8 text-center">
              <p className="text-white/80">No squad selected for this gameweek</p>
            </div>
          )}
        </div>

        {/* Gameweek History Chart */}
        {gwHistoryData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Season Progress</h2>
            <Card>
              <CardContent className="py-4">
                {(() => {
                  const maxPoints = Math.max(...gwHistoryData.map(g => g.points));
                  const minPoints = Math.min(...gwHistoryData.map(g => g.points));
                  // Round to nice numbers for axis
                  const yMax = Math.ceil(maxPoints / 10) * 10;
                  const yMid = Math.round(yMax / 2);

                  return (
                    <div className="flex">
                      {/* Y-axis labels */}
                      <div className="flex flex-col justify-between h-28 pr-2 text-right">
                        <span className="text-[10px] text-gray-500">{yMax}</span>
                        <span className="text-[10px] text-gray-500">{yMid}</span>
                        <span className="text-[10px] text-gray-500">0</span>
                      </div>

                      {/* Chart area */}
                      <div className="flex-1 overflow-x-auto">
                        {/* Y-axis title */}
                        <div className="flex">
                          <div className="flex items-center -ml-6 mr-1">
                            <span className="text-[10px] text-gray-400 -rotate-90 whitespace-nowrap">
                              Points
                            </span>
                          </div>

                          <div className="flex-1">
                            {/* Bars */}
                            <div className="flex items-end gap-1 h-28 border-l border-b border-gray-200 pl-1 pb-1">
                              {gwHistoryData.map((gw) => {
                                const heightPercent = (gw.points / yMax) * 100;
                                const isSelected = gw.event === activeGw;

                                return (
                                  <button
                                    key={gw.event}
                                    onClick={() => setSelectedGw(gw.event)}
                                    className={`flex-shrink-0 w-6 md:w-8 rounded-t transition-all hover:opacity-80 ${
                                      isSelected
                                        ? 'bg-[var(--fpl-purple)]'
                                        : 'bg-[var(--fpl-green)]'
                                    }`}
                                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                                    title={`GW${gw.event}: ${gw.points} pts`}
                                  />
                                );
                              })}
                            </div>

                            {/* X-axis labels (gameweek numbers) */}
                            <div className="flex gap-1 mt-1 pl-1">
                              {gwHistoryData.map((gw) => (
                                <div
                                  key={gw.event}
                                  className="flex-shrink-0 w-6 md:w-8 text-center text-[10px] text-gray-500"
                                >
                                  {gw.event}
                                </div>
                              ))}
                            </div>

                            {/* X-axis title */}
                            <div className="text-center mt-2">
                              <span className="text-[10px] text-gray-400">Gameweek</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Two Column Layout for Leagues and History */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Leagues */}
          {team.leagues?.classic?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Leagues</h2>
              <div className="space-y-2">
                {team.leagues.classic.slice(0, 6).map((league) => (
                  <Card key={league.id} className="p-3">
                    <div className="flex justify-between items-center">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{league.name}</p>
                        <p className="text-sm text-[var(--muted)]">
                          Rank {league.entry_rank?.toLocaleString() || '-'}
                        </p>
                      </div>
                      <div className="text-right text-sm text-[var(--muted)]">
                        of {league.entry_count?.toLocaleString() || '-'}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Chips Used */}
          {history?.chips?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Chips Used</h2>
              <div className="space-y-2">
                {history.chips.map((chip, idx) => (
                  <Card
                    key={idx}
                    className={`p-3 cursor-pointer transition-colors ${
                      chip.event === activeGw
                        ? 'ring-2 ring-[var(--fpl-purple)]'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedGw(chip.event)}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-medium capitalize">
                        {chip.name.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        GW{chip.event}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        {!isViewingCurrentGw && (
          <div className="mt-8">
            <button
              onClick={() => setSelectedGw(currentGw)}
              className="px-4 py-2 bg-[var(--fpl-pink)]/10 text-[var(--fpl-pink)] rounded-lg hover:bg-[var(--fpl-pink)]/20 transition-colors text-sm font-medium"
            >
              Back to Current GW
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
