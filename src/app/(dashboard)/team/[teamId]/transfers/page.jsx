'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { useTeamEntry, useTeamTransfers, useTeamHistory } from '@/hooks/useTeam';
import { useBootstrap, createPlayerMap, createTeamMap } from '@/hooks/useBootstrap';
import { getShirtUrl } from '@/lib/fpl/endpoints';
import { cn } from '@/lib/utils/cn';

export default function TransfersPage() {
  const params = useParams();
  const teamId = params.teamId;

  // Fetch team entry data
  const {
    data: team,
    isLoading: teamLoading,
    error: teamError,
  } = useTeamEntry(teamId);

  // Fetch transfers
  const {
    data: transfers,
    isLoading: transfersLoading,
  } = useTeamTransfers(teamId);

  // Fetch team history for chips used
  const { data: history } = useTeamHistory(teamId);

  // Fetch bootstrap for player names
  const {
    data: bootstrap,
    isLoading: bootstrapLoading,
  } = useBootstrap();

  // Get gameweeks where free transfer chips were used (wildcard, freehit)
  const freeTransferGws = useMemo(() => {
    if (!history?.chips) return new Set();
    return new Set(
      history.chips
        .filter(chip => chip.name === 'wildcard' || chip.name === 'freehit')
        .map(chip => chip.event)
    );
  }, [history?.chips]);

  // Create lookup maps
  const playerMap = useMemo(() => {
    return createPlayerMap(bootstrap?.elements);
  }, [bootstrap?.elements]);

  const teamMap = useMemo(() => {
    return createTeamMap(bootstrap?.teams);
  }, [bootstrap?.teams]);

  // Get chip used for a specific gameweek
  const getChipForGw = (gw) => {
    return history?.chips?.find(chip => chip.event === gw);
  };

  // Group transfers by gameweek
  const transfersByGw = useMemo(() => {
    if (!transfers) return [];

    const grouped = {};
    transfers.forEach(transfer => {
      const gw = transfer.event;
      if (!grouped[gw]) {
        grouped[gw] = [];
      }
      grouped[gw].push(transfer);
    });

    // Sort by gameweek descending (most recent first)
    return Object.entries(grouped)
      .map(([gw, transfers]) => {
        const gameweek = parseInt(gw);
        const chip = getChipForGw(gameweek);
        const isFreeTransferChip = chip?.name === 'wildcard' || chip?.name === 'freehit';

        return {
          gameweek,
          transfers: transfers.sort((a, b) => new Date(b.time) - new Date(a.time)),
          chip: chip?.name,
          isFreeTransferChip,
        };
      })
      .sort((a, b) => b.gameweek - a.gameweek);
  }, [transfers, history?.chips]);

  // Calculate total transfer cost (hits) - excluding wildcard/freehit gameweeks
  const totalHits = useMemo(() => {
    if (!transfers) return 0;

    // Group by gameweek and count transfers beyond the first free one
    const gwCounts = {};
    transfers.forEach(t => {
      gwCounts[t.event] = (gwCounts[t.event] || 0) + 1;
    });

    // Each transfer beyond 1 per GW costs 4 points
    // But NOT if wildcard or freehit was used that gameweek
    let hits = 0;
    Object.entries(gwCounts).forEach(([gw, count]) => {
      const gameweek = parseInt(gw);
      // Skip if wildcard or freehit was used
      if (freeTransferGws.has(gameweek)) return;

      if (count > 1) {
        hits += (count - 1) * 4;
      }
    });
    return hits;
  }, [transfers, freeTransferGws]);

  const isLoading = teamLoading || transfersLoading || bootstrapLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--border)] rounded w-1/3"></div>
            <div className="h-4 bg-[var(--border)] rounded w-1/2"></div>
            <div className="space-y-3 mt-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-[var(--border)] rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (teamError) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
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
          <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href={`/team/${teamId}`} className="hover:text-white">Team</Link>
            <span>/</span>
            <span>Transfers</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Transfer History
          </h1>
          <p className="text-[var(--fpl-green)] mt-1">
            {team.name}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Total Transfers</p>
              <p className="text-2xl font-bold text-[var(--fpl-purple)]">
                {transfers?.length ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Gameweeks</p>
              <p className="text-2xl font-bold">
                {transfersByGw.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Est. Hits</p>
              <p className="text-2xl font-bold text-[var(--fpl-pink)]">
                -{totalHits}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transfers List */}
        {transfersByGw.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No transfers made this season</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {transfersByGw.map(({ gameweek, transfers: gwTransfers, chip, isFreeTransferChip }) => (
              <div key={gameweek}>
                {/* Gameweek header */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <Link
                    href={`/team/${teamId}?gw=${gameweek}`}
                    className="px-3 py-1 bg-[var(--fpl-purple)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--fpl-purple-light)] transition-colors"
                  >
                    GW{gameweek}
                  </Link>
                  <span className="text-sm text-gray-500">
                    {gwTransfers.length} transfer{gwTransfers.length !== 1 ? 's' : ''}
                  </span>
                  {chip && (
                    <span className="px-2 py-0.5 bg-[var(--fpl-cyan)] text-[var(--fpl-purple)] text-xs font-bold rounded uppercase">
                      {chip.replace('_', ' ')}
                    </span>
                  )}
                  {!isFreeTransferChip && gwTransfers.length > 1 && (
                    <span className="text-xs text-[var(--fpl-pink)] font-medium">
                      -{(gwTransfers.length - 1) * 4} pts hit
                    </span>
                  )}
                  {isFreeTransferChip && gwTransfers.length > 1 && (
                    <span className="text-xs text-green-600 font-medium">
                      Free transfers
                    </span>
                  )}
                </div>

                {/* Transfer cards */}
                <div className="space-y-2">
                  {gwTransfers.map((transfer, idx) => (
                    <TransferCard
                      key={`${transfer.event}-${transfer.element_in}-${idx}`}
                      transfer={transfer}
                      playerMap={playerMap}
                      teamMap={teamMap}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back button */}
        <div className="mt-8">
          <Link
            href={`/team/${teamId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--fpl-purple)]/10 text-[var(--fpl-purple)] rounded-lg hover:bg-[var(--fpl-purple)]/20 transition-colors text-sm font-medium"
          >
            <span>&larr;</span>
            Back to Team
          </Link>
        </div>
      </main>
    </div>
  );
}

/**
 * Individual transfer card
 */
function TransferCard({ transfer, playerMap, teamMap }) {
  const playerIn = playerMap.get(transfer.element_in);
  const playerOut = playerMap.get(transfer.element_out);
  const teamIn = teamMap.get(playerIn?.team);
  const teamOut = teamMap.get(playerOut?.team);

  const priceIn = (transfer.element_in_cost / 10).toFixed(1);
  const priceOut = (transfer.element_out_cost / 10).toFixed(1);
  const priceDiff = ((transfer.element_in_cost - transfer.element_out_cost) / 10).toFixed(1);

  const transferDate = new Date(transfer.time);
  const formattedDate = transferDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="overflow-hidden">
      <div className="flex items-stretch">
        {/* Player Out */}
        <div className="flex-1 p-3 bg-red-50 flex items-center gap-3">
          <div className="w-10 h-12 relative flex-shrink-0">
            {teamOut?.code && (
              <Image
                src={getShirtUrl(teamOut.code, playerOut?.element_type === 1)}
                alt={teamOut?.name ?? ''}
                width={40}
                height={48}
                className="object-contain opacity-50"
                unoptimized
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-800 truncate">
              {playerOut?.web_name ?? 'Unknown'}
            </p>
            <p className="text-xs text-gray-500">
              {teamOut?.short_name ?? '???'} · £{priceOut}m
            </p>
          </div>
          <div className="text-red-500 font-bold text-lg">
            OUT
          </div>
        </div>

        {/* Arrow divider */}
        <div className="w-12 bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Player In */}
        <div className="flex-1 p-3 bg-green-50 flex items-center gap-3">
          <div className="w-10 h-12 relative flex-shrink-0">
            {teamIn?.code && (
              <Image
                src={getShirtUrl(teamIn.code, playerIn?.element_type === 1)}
                alt={teamIn?.name ?? ''}
                width={40}
                height={48}
                className="object-contain"
                unoptimized
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-800 truncate">
              {playerIn?.web_name ?? 'Unknown'}
            </p>
            <p className="text-xs text-gray-500">
              {teamIn?.short_name ?? '???'} · £{priceIn}m
            </p>
          </div>
          <div className="text-green-600 font-bold text-lg">
            IN
          </div>
        </div>
      </div>

      {/* Footer with date and price difference */}
      <div className="px-3 py-2 bg-gray-50 flex items-center justify-between text-xs text-gray-500 border-t">
        <span>{formattedDate}</span>
        <span className={cn(
          'font-medium',
          parseFloat(priceDiff) > 0 ? 'text-red-500' : parseFloat(priceDiff) < 0 ? 'text-green-600' : ''
        )}>
          {parseFloat(priceDiff) > 0 ? '+' : ''}£{priceDiff}m
        </span>
      </div>
    </Card>
  );
}
