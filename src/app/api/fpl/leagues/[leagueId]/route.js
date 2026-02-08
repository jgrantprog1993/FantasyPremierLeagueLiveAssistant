import { NextResponse } from 'next/server';
import { FPL_BASE_URL } from '@/lib/fpl/endpoints';

export async function GET(request, { params }) {
  const { leagueId } = await params;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || 1;

  try {
    const response = await fetch(
      `${FPL_BASE_URL}/leagues-classic/${leagueId}/standings/?page_standings=${page}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FPL Dashboard)',
        },
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch league standings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('League fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league standings' },
      { status: 500 }
    );
  }
}
