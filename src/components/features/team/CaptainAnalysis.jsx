'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { getShirtUrl } from '@/lib/fpl/endpoints';
import { cn } from '@/lib/utils/cn';

/**
 * Captain Analysis Component
 * Shows if the captain choice was optimal vs other options
 */
export function CaptainAnalysis({ picks, playerMap, teamMap, liveData }) {
  const analysis = useMemo(() => {
    if (!picks?.length || !liveData?.elements || !playerMap) return null;

    const livePointsMap = new Map(
      liveData.elements.map(e => [e.id, e.stats?.total_points ?? 0])
    );

    // Get starters only (position 1-11)
    const starters = picks.filter(p => p.position <= 11);

    // Find the captain
    const captainPick = starters.find(p => p.is_captain);
    if (!captainPick) return null;

    const captain = playerMap.get(captainPick.element);
    const captainPoints = livePointsMap.get(captainPick.element) ?? 0;
    const captainMultiplier = captainPick.multiplier ?? 2;
    const captainTotalPoints = captainPoints * captainMultiplier;

    // Calculate what each starter would have scored as captain
    const alternatives = starters
      .filter(p => !p.is_captain)
      .map(pick => {
        const player = playerMap.get(pick.element);
        const basePoints = livePointsMap.get(pick.element) ?? 0;
        const asCapPoints = basePoints * captainMultiplier;
        const difference = asCapPoints - captainTotalPoints;

        return {
          pick,
          player,
          basePoints,
          asCapPoints,
          difference,
        };
      })
      .sort((a, b) => b.asCapPoints - a.asCapPoints);

    // Find optimal captain (highest scorer)
    const optimal = alternatives[0];
    const wasOptimal = !optimal || captainTotalPoints >= optimal.asCapPoints;

    // Top 3 alternatives that would have scored more
    const betterOptions = alternatives.filter(a => a.difference > 0).slice(0, 3);

    return {
      captain,
      captainPick,
      captainPoints,
      captainTotalPoints,
      captainMultiplier,
      optimal,
      wasOptimal,
      betterOptions,
      pointsLost: optimal ? Math.max(0, optimal.asCapPoints - captainTotalPoints) : 0,
    };
  }, [picks, playerMap, liveData]);

  if (!analysis) return null;

  const { captain, captainTotalPoints, captainMultiplier, wasOptimal, betterOptions, pointsLost } = analysis;
  const captainTeam = teamMap?.get(captain?.team);

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
            Captain Analysis
          </h3>
          {wasOptimal ? (
            <span className="px-2 py-1 bg-[var(--fpl-green)]/20 text-[var(--fpl-green)] text-xs font-bold rounded">
              OPTIMAL
            </span>
          ) : (
            <span className="px-2 py-1 bg-[var(--fpl-pink)]/20 text-[var(--fpl-pink)] text-xs font-bold rounded">
              -{pointsLost} PTS
            </span>
          )}
        </div>

        {/* Captain Display */}
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-lg mb-3',
          wasOptimal ? 'bg-[var(--fpl-green)]/10' : 'bg-white/5'
        )}>
          {/* Jersey */}
          <div className="w-10 h-12 relative flex-shrink-0">
            {captainTeam?.code && (
              <Image
                src={getShirtUrl(captainTeam.code, captain.element_type === 1)}
                alt={captainTeam.name}
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
              <span className="font-bold text-white truncate">
                {captain?.web_name}
              </span>
              <span className="px-1.5 py-0.5 bg-[var(--fpl-purple)] text-white text-xs font-bold rounded">
                C
              </span>
              {captainMultiplier === 3 && (
                <span className="px-1.5 py-0.5 bg-[var(--fpl-pink)] text-white text-xs font-bold rounded">
                  3x
                </span>
              )}
            </div>
            <p className="text-sm text-white/60">
              {captainTeam?.short_name}
            </p>
          </div>

          {/* Points */}
          <div className="text-right">
            <p className="text-2xl font-bold text-[var(--fpl-green)]">
              {captainTotalPoints}
            </p>
            <p className="text-xs text-white/50">
              ({analysis.captainPoints} × {captainMultiplier})
            </p>
          </div>
        </div>

        {/* Better Options */}
        {betterOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/50 uppercase tracking-wide">
              Better options
            </p>
            {betterOptions.map(({ player, asCapPoints, difference }) => {
              const team = teamMap?.get(player?.team);
              return (
                <div
                  key={player?.id}
                  className="flex items-center justify-between p-2 rounded bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-7 relative flex-shrink-0">
                      {team?.code && (
                        <Image
                          src={getShirtUrl(team.code, player.element_type === 1)}
                          alt={team.name}
                          width={24}
                          height={28}
                          className="object-contain"
                          unoptimized
                        />
                      )}
                    </div>
                    <span className="text-sm text-white/80">{player?.web_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {asCapPoints}
                    </span>
                    <span className="text-xs text-[var(--fpl-green)]">
                      +{difference}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Optimal Choice Message */}
        {wasOptimal && betterOptions.length === 0 && (
          <p className="text-sm text-[var(--fpl-green)] text-center">
            Perfect captain choice this gameweek!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
