import { NextResponse } from 'next/server';
import { fplFetch, FPLError } from '@/lib/fpl/api';
import { FPL_ENDPOINTS } from '@/lib/fpl/endpoints';
import { CACHE_STRATEGIES } from '@/lib/cache/strategies';

/**
 * GET /api/fpl/bootstrap
 * Fetch bootstrap-static data (players, teams, gameweeks)
 */
export async function GET() {
  try {
    const data = await fplFetch(FPL_ENDPOINTS.BOOTSTRAP, {
      revalidate: CACHE_STRATEGIES.BOOTSTRAP.ttl,
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `s-maxage=${CACHE_STRATEGIES.BOOTSTRAP.cdnMaxAge}, stale-while-revalidate=${CACHE_STRATEGIES.BOOTSTRAP.staleWhileRevalidate}`,
      },
    });
  } catch (error) {
    if (error instanceof FPLError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error('Error fetching bootstrap:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bootstrap data' },
      { status: 500 }
    );
  }
}
