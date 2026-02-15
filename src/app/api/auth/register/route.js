import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';

/**
 * POST /api/auth/register
 * Create a new user account
 */
export async function POST(request) {
  try {
    const { email, password, teamId, name } = await request.json();

    // Validate required fields
    if (!email || !password || !teamId) {
      return NextResponse.json(
        { error: 'Email, password, and Team ID are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate Team ID
    const teamIdNum = parseInt(teamId, 10);
    if (isNaN(teamIdNum) || teamIdNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid Team ID' },
        { status: 400 }
      );
    }

    // Verify Team ID exists on FPL
    const fplResponse = await fetch(
      `https://fantasy.premierleague.com/api/entry/${teamIdNum}/`,
      { next: { revalidate: 0 } }
    );

    if (!fplResponse.ok) {
      return NextResponse.json(
        { error: 'Team ID not found. Please verify your FPL Team ID.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        teamId: teamIdNum,
        name: name?.trim() || null,
      },
    });

    // Create session
    const token = await createSession({
      userId: user.id,
      email: user.email,
      teamId: user.teamId,
      name: user.name,
    });

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        teamId: user.teamId,
        name: user.name,
      },
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
