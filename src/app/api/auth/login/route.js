import { NextResponse } from 'next/server';
import { FPL_LOGIN_URL, FPL_BASE_URL } from '@/lib/fpl/endpoints';
import { SESSION_EXPIRY } from '@/lib/cache/strategies';

// Use the same user agent as the Python fpl library
const FPL_USER_AGENT = 'Dalvik/2.1.0 (Linux; U; Android 5.1; PRO 5 Build/LMY47D)';

/**
 * POST /api/auth/login
 * Proxy FPL login and create session
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create form data for FPL login (matching the fpl Python library)
    const formData = new URLSearchParams({
      login: email,
      password: password,
      app: 'plfpl-web',
      redirect_uri: 'https://fantasy.premierleague.com/a/login',
    });

    console.log('Attempting FPL login for:', email);

    // Step 1: Authenticate with FPL using the same approach as the fpl Python library
    const loginResponse = await fetch(FPL_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': FPL_USER_AGENT,
      },
      body: formData,
      redirect: 'manual', // Don't follow redirects, we need to check cookies
    });

    console.log('Login response status:', loginResponse.status);

    // Extract cookies from response
    const setCookieHeaders = loginResponse.headers.getSetCookie();
    console.log('Set-Cookie count:', setCookieHeaders?.length || 0);

    // Parse all cookies
    let plProfile = null;
    let sessionId = null;

    if (setCookieHeaders && setCookieHeaders.length > 0) {
      for (const cookie of setCookieHeaders) {
        if (cookie.startsWith('pl_profile=')) {
          const value = cookie.split(';')[0].split('=').slice(1).join('=');
          if (value && value !== '""' && value.length > 2) {
            plProfile = value;
            console.log('Found pl_profile cookie');
          }
        }
        if (cookie.startsWith('sessionid=')) {
          const value = cookie.split(';')[0].split('=').slice(1).join('=');
          if (value && value !== '""' && value.length > 2) {
            sessionId = value;
            console.log('Found sessionid cookie');
          }
        }
      }
    }

    // Check the redirect URL for failure indication (as the fpl library does)
    const location = loginResponse.headers.get('location');
    if (location) {
      console.log('Redirect location:', location);
      const url = new URL(location, 'https://users.premierleague.com');
      const state = url.searchParams.get('state');
      const reason = url.searchParams.get('reason');

      if (state === 'fail') {
        console.log('Login failed, reason:', reason);
        return NextResponse.json(
          { error: reason || 'Invalid email or password' },
          { status: 401 }
        );
      }
    }

    // Check if we got the authentication cookies
    if (!plProfile) {
      console.log('No pl_profile cookie received');

      // Check response body for error messages
      try {
        const responseText = await loginResponse.text();
        console.log('Response body preview:', responseText.substring(0, 300));
      } catch (e) {
        // Ignore
      }

      return NextResponse.json({
        error: 'Login failed. FPL may be blocking automated requests. Try the Quick View option with your Team ID instead.',
        hint: 'You can find your Team ID in the URL when viewing your team on the FPL website.'
      }, { status: 401 });
    }

    console.log('Got authentication cookies, fetching user profile...');

    // Step 2: Fetch user profile to get team_id
    const cookieHeader = sessionId
      ? `pl_profile=${plProfile}; sessionid=${sessionId}`
      : `pl_profile=${plProfile}`;

    const meResponse = await fetch(`${FPL_BASE_URL}/me/`, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': FPL_USER_AGENT,
      },
    });

    console.log('Me response status:', meResponse.status);

    if (!meResponse.ok) {
      const errorText = await meResponse.text();
      console.log('Me response error:', errorText);

      if (meResponse.status === 403) {
        return NextResponse.json({
          error: 'FPL is blocking automated access. Please use Quick View with your Team ID.',
          hint: 'Find your Team ID in the URL when viewing your team on fantasy.premierleague.com'
        }, { status: 403 });
      }

      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    const userProfile = await meResponse.json();
    console.log('User profile received for team:', userProfile.player?.entry);

    if (!userProfile.player?.entry) {
      return NextResponse.json(
        { error: 'No FPL team found for this account' },
        { status: 400 }
      );
    }

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      teamId: userProfile.player.entry,
      name: `${userProfile.player.first_name} ${userProfile.player.last_name}`,
    });

    // Set session cookie with FPL cookies
    const sessionData = Buffer.from(JSON.stringify({
      pl_profile: plProfile,
      sessionid: sessionId,
      teamId: userProfile.player.entry,
      email: email,
    })).toString('base64');

    response.cookies.set('fpl_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY.AUTHENTICATED,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed: ' + error.message },
      { status: 500 }
    );
  }
}
