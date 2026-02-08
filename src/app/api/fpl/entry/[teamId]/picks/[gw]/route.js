import { NextResponse } from 'next/server';
import { fplFetch, FPLError } from '@/lib/fpl/api';
import { FPL_ENDPOINTS } from '@/lib/fpl/endpoints';
import { CACHE_STRATEGIES } from '@/lib/cache/strategies';

/**
 * GET /api/fpl/entry/[teamId]/picks/[gw]
 * Fetch team's picks for a specific gameweek
 */
export async function GET(request, { params }) {
  const { teamId, gw } = await params;
  const id = parseInt(teamId, 10);
  const gameweek = parseInt(gw, 10);

  if (isNaN(id) || id <= 0) {
    return NextResponse.json(
      { error: 'Invalid team ID' },
      { status: 400 }
    );
  }

  if (isNaN(gameweek) || gameweek < 1 || gameweek > 38) {
    return NextResponse.json(
      { error: 'Invalid gameweek. Must be between 1 and 38' },
      { status: 400 }
    );
  }

  try {
    // Check if gameweek is current or past to determine cache strategy
    const bootstrap = await fplFetch(FPL_ENDPOINTS.BOOTSTRAP, {
      revalidate: CACHE_STRATEGIES.BOOTSTRAP.ttl,
    });

    const currentGw = bootstrap.events.find(e => e.is_current)?.id ?? 1;
    const isPast = gameweek < currentGw;

    const cacheStrategy = isPast
      ? CACHE_STRATEGIES.TEAM_PICKS_PAST
      : CACHE_STRATEGIES.TEAM_PICKS_CURRENT;

    const data = await fplFetch(FPL_ENDPOINTS.ENTRY_PICKS(id, gameweek), {
      revalidate: cacheStrategy.ttl,
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `s-maxage=${cacheStrategy.cdnMaxAge}, stale-while-revalidate=${cacheStrategy.staleWhileRevalidate}`,
      },
    });
  } catch (error) {
    if (error instanceof FPLError) {
      if (error.status === 404) {
        return NextResponse.json(
          { error: 'Team or gameweek not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error('Error fetching picks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team picks' },
      { status: 500 }
    );
  }
}
