import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

/**
 * GET /api/auth/me
 * Get current user from session
 */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      userId: session.userId,
      email: session.email,
      teamId: session.teamId,
      name: session.name,
    },
  });
}
