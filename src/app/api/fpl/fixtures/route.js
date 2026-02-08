import { NextResponse } from 'next/server';
import { fplFetch, FPLError } from '@/lib/fpl/api';
import { FPL_ENDPOINTS } from '@/lib/fpl/endpoints';
import { CACHE_STRATEGIES } from '@/lib/cache/strategies';

/**
 * GET /api/fpl/fixtures
 * Fetch all fixtures or fixtures for a specific gameweek
 * Query params: ?gw=1 (optional)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gw = searchParams.get('gw');

  try {
    const endpoint = gw
      ? FPL_ENDPOINTS.FIXTURES_BY_GW(parseInt(gw, 10))
      : FPL_ENDPOINTS.FIXTURES;

    const data = await fplFetch(endpoint, {
      revalidate: CACHE_STRATEGIES.FIXTURES.ttl,
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `s-maxage=${CACHE_STRATEGIES.FIXTURES.cdnMaxAge}, stale-while-revalidate=${CACHE_STRATEGIES.FIXTURES.staleWhileRevalidate}`,
      },
    });
  } catch (error) {
    if (error instanceof FPLError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error('Error fetching fixtures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fixtures data' },
      { status: 500 }
    );
  }
}
