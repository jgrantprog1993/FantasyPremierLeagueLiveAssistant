'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PlayerCard, BenchPlayerCard, MATCH_STATUS } from './PlayerCard';
import { cn } from '@/lib/utils/cn';

/**
 * Organize picks by position on the pitch
 * @param {Array} picks - Array of picks from API
 * @param {Map} playerMap - Map of player ID to player data
 * @returns {Object} - Players organized by position row
 */
function organizeByPosition(picks, playerMap) {
  const starters = picks?.filter(p => p.position <= 11) ?? [];
  const bench = picks?.filter(p => p.position > 11) ?? [];

  // Group starters by element_type (position)
  const goalkeepers = [];
  const defenders = [];
  const midfielders = [];
  const forwards = [];

  starters.forEach(pick => {
    const player = playerMap.get(pick.element);
    if (!player) return;

    const pickWithPlayer = { ...pick, player };

    switch (player.element_type) {
      case 1:
        goalkeepers.push(pickWithPlayer);
        break;
      case 2:
        defenders.push(pickWithPlayer);
        break;
      case 3:
        midfielders.push(pickWithPlayer);
        break;
      case 4:
        forwards.push(pickWithPlayer);
        break;
    }
  });

  // Sort each row by position to maintain formation order
  [goalkeepers, defenders, midfielders, forwards].forEach(row => {
    row.sort((a, b) => a.position - b.position);
  });

  return {
    goalkeepers,
    defenders,
    midfielders,
    forwards,
    bench: bench.map(pick => ({
      ...pick,
      player: playerMap.get(pick.element),
    })),
  };
}

/**
 * Get formation string from picks (e.g., "3-5-2")
 */
function getFormation(organized) {
  const def = organized.defenders.length;
  const mid = organized.midfielders.length;
  const fwd = organized.forwards.length;
  return `${def}-${mid}-${fwd}`;
}

/**
 * Get match status for a player based on their team's fixture
 * @param {number} playerTeamId - The player's team ID
 * @param {Array} fixtures - Array of fixtures for the gameweek
 * @returns {string} - Match status
 */
function getMatchStatus(playerTeamId, fixtures) {
  if (!fixtures || !playerTeamId) return MATCH_STATUS.NOT_STARTED;

  const fixture = fixtures.find(
    f => f.team_h === playerTeamId || f.team_a === playerTeamId
  );

  if (!fixture) return MATCH_STATUS.NOT_STARTED;

  if (fixture.finished || fixture.finished_provisional) {
    return MATCH_STATUS.FINISHED;
  }

  if (fixture.started) {
    return MATCH_STATUS.PLAYING;
  }

  return MATCH_STATUS.NOT_STARTED;
}

/**
 * TeamPitch component - Visual formation display
 * @param {Object} props
 * @param {Array} props.picks - Team picks for the gameweek
 * @param {Map} props.playerMap - Map of player IDs to player data
 * @param {Map} props.teamMap - Map of team IDs to team data
 * @param {Object} props.liveData - Live gameweek data for points
 * @param {Array} props.fixtures - Fixtures for the current gameweek
 * @param {Function} props.onPlayerClick - Handler for player click
 */
export function TeamPitch({
  picks,
  playerMap,
  teamMap,
  liveData,
  fixtures,
  onPlayerClick,
}) {
  const router = useRouter();

  // Create live points lookup
  const livePointsMap = useMemo(() => {
    if (!liveData?.elements) return new Map();
    return new Map(liveData.elements.map(e => [e.id, e.stats?.total_points ?? 0]));
  }, [liveData]);

  // Organize picks by position
  const organized = useMemo(() => {
    return organizeByPosition(picks, playerMap);
  }, [picks, playerMap]);

  const formation = getFormation(organized);

  // Default click handler navigates to player page
  const handlePlayerClick = (player) => {
    if (onPlayerClick) {
      onPlayerClick(player);
    } else {
      router.push(`/players/${player.id}`);
    }
  };

  // Calculate points for a pick (including captain multiplier)
  const getPickPoints = (pick) => {
    const basePoints = livePointsMap.get(pick.element) ?? 0;
    return pick.is_captain ? basePoints * (pick.multiplier ?? 2) : basePoints;
  };

  // Get match status for a player
  const getPlayerMatchStatus = (player) => {
    return getMatchStatus(player?.team, fixtures);
  };

  // Calculate total points
  const totalPoints = useMemo(() => {
    return organized.goalkeepers
      .concat(organized.defenders, organized.midfielders, organized.forwards)
      .reduce((sum, pick) => sum + getPickPoints(pick), 0);
  }, [organized, livePointsMap]);

  if (!picks || picks.length === 0) {
    return (
      <div className="pitch-bg rounded-lg p-8 text-center">
        <p className="text-white/80">No picks available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pitch */}
      <div className="pitch-bg rounded-lg p-4 md:p-6 relative overflow-hidden">
        {/* Formation label */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/30 rounded text-white text-xs font-medium">
          {formation}
        </div>

        {/* Total points */}
        <div className="absolute top-2 right-2 px-3 py-1 bg-[var(--fpl-green)] rounded text-[var(--fpl-purple)] text-sm font-bold">
          {totalPoints} pts
        </div>

        {/* Pitch layout - Goalkeeper at top, Forwards at bottom */}
        <div className="flex flex-col items-center gap-4 md:gap-6 py-4">
          {/* Goalkeeper */}
          <PitchRow
            players={organized.goalkeepers}
            teamMap={teamMap}
            onPlayerClick={handlePlayerClick}
            getPickPoints={getPickPoints}
            getPlayerMatchStatus={getPlayerMatchStatus}
          />

          {/* Defenders */}
          <PitchRow
            players={organized.defenders}
            teamMap={teamMap}
            onPlayerClick={handlePlayerClick}
            getPickPoints={getPickPoints}
            getPlayerMatchStatus={getPlayerMatchStatus}
          />

          {/* Midfielders */}
          <PitchRow
            players={organized.midfielders}
            teamMap={teamMap}
            onPlayerClick={handlePlayerClick}
            getPickPoints={getPickPoints}
            getPlayerMatchStatus={getPlayerMatchStatus}
          />

          {/* Forwards */}
          <PitchRow
            players={organized.forwards}
            teamMap={teamMap}
            onPlayerClick={handlePlayerClick}
            getPickPoints={getPickPoints}
            getPlayerMatchStatus={getPlayerMatchStatus}
          />
        </div>
      </div>

      {/* Bench */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Substitutes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {organized.bench.map((pick, idx) => (
            <BenchPlayerCard
              key={pick.element ?? idx}
              player={pick.player}
              pick={pick}
              points={livePointsMap.get(pick.element) ?? 0}
              team={teamMap?.get(pick.player?.team)}
              matchStatus={getPlayerMatchStatus(pick.player)}
              onClick={handlePlayerClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * A row of players on the pitch
 */
function PitchRow({ players, teamMap, onPlayerClick, getPickPoints, getPlayerMatchStatus }) {
  if (!players || players.length === 0) return null;

  return (
    <div className="flex justify-center gap-2 md:gap-4">
      {players.map((pick, idx) => (
        <PlayerCard
          key={pick.element ?? idx}
          player={pick.player}
          pick={pick}
          points={getPickPoints(pick)}
          team={teamMap?.get(pick.player?.team)}
          matchStatus={getPlayerMatchStatus(pick.player)}
          onClick={onPlayerClick}
        />
      ))}
    </div>
  );
}

/**
 * Loading skeleton for TeamPitch
 */
export function TeamPitchSkeleton() {
  const SkeletonPlayer = () => (
    <div className="flex flex-col items-center w-16 md:w-20">
      <div className="w-12 h-16 md:w-14 md:h-[72px] rounded bg-white/20" />
      <div className="mt-1.5 h-4 w-14 bg-white/20 rounded" />
      <div className="mt-0.5 h-4 w-8 bg-white/20 rounded" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="pitch-bg rounded-lg p-4 md:p-6 animate-pulse">
        <div className="flex flex-col items-center gap-4 md:gap-5 py-4">
          {/* Goalkeeper skeleton */}
          <div className="flex justify-center">
            <SkeletonPlayer />
          </div>

          {/* Defenders row skeleton */}
          <div className="flex justify-center gap-2 md:gap-4">
            {[1, 2, 3, 4].map(i => (
              <SkeletonPlayer key={i} />
            ))}
          </div>

          {/* Midfielders row skeleton */}
          <div className="flex justify-center gap-2 md:gap-4">
            {[1, 2, 3, 4].map(i => (
              <SkeletonPlayer key={i} />
            ))}
          </div>

          {/* Forwards row skeleton */}
          <div className="flex justify-center gap-2 md:gap-4">
            {[1, 2].map(i => (
              <SkeletonPlayer key={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Bench skeleton */}
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeamPitch;
