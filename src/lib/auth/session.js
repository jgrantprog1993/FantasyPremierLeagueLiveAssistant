import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SESSION_EXPIRY } from '@/lib/cache/strategies';

const SESSION_COOKIE_NAME = 'fpl_auth_session';

/**
 * Get the JWT secret as a Uint8Array
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Create a new session JWT
 * @param {Object} payload - Session data (userId, email, teamId, name)
 * @returns {Promise<string>} Signed JWT
 */
export async function createSession(payload) {
  const secret = getJwtSecret();

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  return token;
}

/**
 * Verify and decode a session JWT
 * @param {string} token - JWT to verify
 * @returns {Promise<Object|null>} Decoded payload or null if invalid
 */
export async function verifySession(token) {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Get the current session from cookies
 * @returns {Promise<Object|null>} Session payload or null
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Set session cookie with JWT
 * @param {import('next/server').NextResponse} response - Response to set cookie on
 * @param {string} token - JWT token
 */
export function setSessionCookie(response, token) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY.AUTHENTICATED,
    path: '/',
  });
}

/**
 * Clear session cookie
 * @param {import('next/server').NextResponse} response - Response to clear cookie on
 */
export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export { SESSION_COOKIE_NAME };
