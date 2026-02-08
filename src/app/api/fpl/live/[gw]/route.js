import { NextResponse } from 'next/server';
import { fplFetch, FPLError } from '@/lib/fpl/api';
import { FPL_ENDPOINTS } from '@/lib/fpl/endpoints';
import { CACHE_STRATEGIES } from '@/lib/cache/strategies';

/**
 * GET /api/fpl/live/[gw]
 * Fetch live gameweek data
 * Uses shorter cache for active gameweeks
 */
export async function GET(request, { params }) {
  const { gw } = await params;
  const gameweek = parseInt(gw, 10);

  if (isNaN(gameweek) || gameweek < 1 || gameweek > 38) {
    return NextResponse.json(
      { error: 'Invalid gameweek. Must be between 1 and 38' },
      { status: 400 }
    );
  }

  try {
    // First fetch bootstrap to check if gameweek is finished
    const bootstrap = await fplFetch(FPL_ENDPOINTS.BOOTSTRAP, {
      revalidate: CACHE_STRATEGIES.BOOTSTRAP.ttl,
    });

    const gwData = bootstrap.events.find(e => e.id === gameweek);
    const isFinished = gwData?.finished ?? false;

    // Use appropriate cache strategy based on gameweek status
    const cacheStrategy = isFinished
      ? CACHE_STRATEGIES.LIVE_GW_FINISHED
      : CACHE_STRATEGIES.LIVE_GW_ACTIVE;

    const data = await fplFetch(FPL_ENDPOINTS.LIVE_GW(gameweek), {
      revalidate: cacheStrategy.ttl,
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `s-maxage=${cacheStrategy.cdnMaxAge}, stale-while-revalidate=${cacheStrategy.staleWhileRevalidate}`,
      },
    });
  } catch (error) {
    if (error instanceof FPLError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error('Error fetching live data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live gameweek data' },
      { status: 500 }
    );
  }
}
