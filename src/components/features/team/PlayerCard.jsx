'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { getShirtUrl } from '@/lib/fpl/endpoints';

/**
 * Match status types
 */
export const MATCH_STATUS = {
  NOT_STARTED: 'not_started',
  PLAYING: 'playing',
  FINISHED: 'finished',
};

/**
 * Position labels for fallback display
 */
const POSITION_LABELS = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

/**
 * PlayerCard component for displaying a player on the pitch
 * @param {Object} props
 * @param {Object} props.player - Player data from bootstrap
 * @param {Object} props.pick - Pick data (position, is_captain, etc.)
 * @param {number} props.points - Live points for this player
 * @param {Object} props.team - Team data for the player's club
 * @param {boolean} props.isBench - Whether this is a bench player
 * @param {string} props.matchStatus - Match status: 'playing', 'finished', 'not_started'
 * @param {Function} props.onClick - Click handler
 */
export function PlayerCard({
  player,
  pick,
  points = 0,
  team,
  isBench = false,
  matchStatus = MATCH_STATUS.NOT_STARTED,
  onClick,
}) {
  if (!player) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-200 animate-pulse" />
        <div className="mt-1 h-4 w-12 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const displayName = player.web_name ?? `${player.first_name?.[0]}. ${player.second_name}`;
  const isGoalkeeper = player.element_type === 1;
  const shirtUrl = team?.code ? getShirtUrl(team.code, isGoalkeeper) : null;

  // Determine styling based on match status
  const isPlaying = matchStatus === MATCH_STATUS.PLAYING;
  const isFinished = matchStatus === MATCH_STATUS.FINISHED;

  return (
    <button
      onClick={() => onClick?.(player)}
      className={cn(
        'flex flex-col items-center group transition-all hover:scale-105 w-16 md:w-20',
        isBench && 'opacity-75',
        isFinished && 'opacity-60 grayscale-[30%]'
      )}
    >
      {/* Player jersey */}
      <div className="relative flex-shrink-0">
        {/* Live match indicator ring */}
        {isPlaying && (
          <div className="absolute inset-x-0 top-1 w-12 h-12 md:w-14 md:h-14 mx-auto rounded-full border-2 border-[var(--fpl-green)] animate-pulse" />
        )}

        {shirtUrl ? (
          <div className={cn(
            'w-12 h-16 md:w-14 md:h-[72px] relative flex items-end justify-center',
            isPlaying && 'drop-shadow-[0_0_8px_rgba(0,255,135,0.5)]'
          )}>
            <Image
              src={shirtUrl}
              alt={`${team?.name ?? 'Team'} shirt`}
              width={56}
              height={72}
              className="object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-xs shadow-md">
            {team?.short_name ?? '???'}
          </div>
        )}

        {/* Captain badge */}
        {pick?.is_captain && (
          <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-[var(--fpl-purple)] text-white text-xs font-bold flex items-center justify-center shadow z-10">
            C
          </div>
        )}

        {/* Vice captain badge */}
        {pick?.is_vice_captain && !pick?.is_captain && (
          <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-[var(--fpl-purple)]/70 text-white text-xs font-bold flex items-center justify-center shadow z-10">
            V
          </div>
        )}

        {/* Live match indicator dot */}
        {isPlaying && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[var(--fpl-green)] animate-pulse" />
        )}
      </div>

      {/* Player name */}
      <div className={cn(
        'mt-1.5 px-1.5 py-0.5 rounded text-[10px] md:text-xs font-medium max-w-full truncate shadow-sm',
        isPlaying
          ? 'bg-[var(--fpl-green)] text-[var(--fpl-purple)]'
          : 'bg-white text-gray-800'
      )}>
        {displayName}
      </div>

      {/* Points */}
      <div
        className={cn(
          'mt-0.5 px-2 py-0.5 rounded text-[10px] md:text-xs font-bold',
          isFinished
            ? 'bg-gray-400 text-white'
            : points > 0
              ? 'bg-[var(--fpl-green)] text-[var(--fpl-purple)]'
              : points < 0
                ? 'bg-red-500 text-white'
                : 'bg-gray-600 text-white'
        )}
      >
        {points}
      </div>
    </button>
  );
}

/**
 * Compact player card for bench display
 */
export function BenchPlayerCard({
  player,
  pick,
  points = 0,
  team,
  matchStatus = MATCH_STATUS.NOT_STARTED,
  onClick,
}) {
  if (!player) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded animate-pulse">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const displayName = player.web_name ?? `${player.first_name?.[0]}. ${player.second_name}`;
  const isGoalkeeper = player.element_type === 1;
  const shirtUrl = team?.code ? getShirtUrl(team.code, isGoalkeeper) : null;

  const isPlaying = matchStatus === MATCH_STATUS.PLAYING;
  const isFinished = matchStatus === MATCH_STATUS.FINISHED;

  return (
    <button
      onClick={() => onClick?.(player)}
      className={cn(
        'flex items-center gap-2 p-2 rounded shadow-sm transition-colors w-full',
        isPlaying
          ? 'bg-[var(--fpl-green)]/20 hover:bg-[var(--fpl-green)]/30'
          : isFinished
            ? 'bg-gray-100 opacity-60'
            : 'bg-white/80 hover:bg-white'
      )}
    >
      {shirtUrl ? (
        <div className="w-8 h-10 relative flex-shrink-0">
          <Image
            src={shirtUrl}
            alt={`${team?.name ?? 'Team'} shirt`}
            width={32}
            height={40}
            className="object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {POSITION_LABELS[player.element_type]}
        </div>
      )}
      <div className="flex-1 text-left min-w-0">
        <div className="text-xs font-medium text-gray-800 truncate">
          {displayName}
        </div>
        <div className="text-[10px] text-gray-500 flex items-center gap-1">
          {team?.short_name}
          {isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-[var(--fpl-green)] animate-pulse" />}
        </div>
      </div>
      <div
        className={cn(
          'px-2 py-0.5 rounded text-xs font-bold flex-shrink-0',
          isFinished
            ? 'bg-gray-400 text-white'
            : points > 0
              ? 'bg-[var(--fpl-green)] text-[var(--fpl-purple)]'
              : points < 0
                ? 'bg-red-500 text-white'
                : 'bg-gray-400 text-white'
        )}
      >
        {points}
      </div>
    </button>
  );
}

export default PlayerCard;
