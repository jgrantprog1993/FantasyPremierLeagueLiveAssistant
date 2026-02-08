import { NextResponse } from 'next/server';
import { fplFetch, FPLError } from '@/lib/fpl/api';
import { FPL_ENDPOINTS } from '@/lib/fpl/endpoints';
import { CACHE_STRATEGIES } from '@/lib/cache/strategies';

/**
 * GET /api/fpl/element/[playerId]
 * Fetch player summary data (fixtures, history)
 */
export async function GET(request, { params }) {
  const { playerId } = await params;
  const id = parseInt(playerId, 10);

  if (isNaN(id) || id <= 0) {
    return NextResponse.json(
      { error: 'Invalid player ID' },
      { status: 400 }
    );
  }

  try {
    const data = await fplFetch(FPL_ENDPOINTS.ELEMENT_SUMMARY(id), {
      revalidate: CACHE_STRATEGIES.PLAYER_SUMMARY.ttl,
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `s-maxage=${CACHE_STRATEGIES.PLAYER_SUMMARY.cdnMaxAge}, stale-while-revalidate=${CACHE_STRATEGIES.PLAYER_SUMMARY.staleWhileRevalidate}`,
      },
    });
  } catch (error) {
    if (error instanceof FPLError) {
      if (error.status === 404) {
        return NextResponse.json(
          { error: 'Player not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player data' },
      { status: 500 }
    );
  }
}
