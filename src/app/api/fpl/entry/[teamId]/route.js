import { NextResponse } from 'next/server';
import { fplFetch, FPLError } from '@/lib/fpl/api';
import { FPL_ENDPOINTS } from '@/lib/fpl/endpoints';
import { CACHE_STRATEGIES } from '@/lib/cache/strategies';

/**
 * GET /api/fpl/entry/[teamId]
 * Fetch team information by ID
 */
export async function GET(request, { params }) {
  const { teamId } = await params;
  const id = parseInt(teamId, 10);

  if (isNaN(id) || id <= 0) {
    return NextResponse.json(
      { error: 'Invalid team ID' },
      { status: 400 }
    );
  }

  try {
    const data = await fplFetch(FPL_ENDPOINTS.ENTRY(id), {
      revalidate: CACHE_STRATEGIES.TEAM_ENTRY.ttl,
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `s-maxage=${CACHE_STRATEGIES.TEAM_ENTRY.cdnMaxAge}, stale-while-revalidate=${CACHE_STRATEGIES.TEAM_ENTRY.staleWhileRevalidate}`,
      },
    });
  } catch (error) {
    if (error instanceof FPLError) {
      if (error.status === 404) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team data' },
      { status: 500 }
    );
  }
}
