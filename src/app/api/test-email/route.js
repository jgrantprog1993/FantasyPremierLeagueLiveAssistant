import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET(request) {
  const apiKey = process.env.RESEND_API_KEY;

  console.log('=== TEST EMAIL DEBUG ===');
  console.log('API Key exists:', !!apiKey);
  console.log('API Key prefix:', apiKey ? apiKey.substring(0, 10) : 'N/A');
  console.log('API Key length:', apiKey ? apiKey.length : 0);

  try {
    const resend = new Resend(apiKey);

    // Get email from query string or use a test email
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email');

    if (!testEmail) {
      return NextResponse.json({
        error: 'Add ?email=your@email.com to test',
        apiKeyExists: !!apiKey,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) : null
      });
    }

    console.log('Sending test email to:', testEmail);

    const { data, error } = await resend.emails.send({
      from: 'FPL Dashboard <onboarding@resend.dev>',
      to: testEmail,
      subject: 'Test Email from FPL Dashboard',
      html: '<p>If you receive this, Resend is working!</p>',
    });

    console.log('Resend response - data:', data);
    console.log('Resend response - error:', error);

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Exception:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
      stack: err.stack
    }, { status: 500 });
  }
}
