import { Resend } from 'resend';

// For testing: use Resend's shared domain (can only send to your own email)
// For production: verify your domain in Resend and use your own email
const FROM_EMAIL = process.env.FROM_EMAIL || 'FPL Dashboard <onboarding@resend.dev>';

// Lazy initialization to ensure env vars are loaded
let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    console.log('Initializing Resend with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendPasswordResetEmail(email, resetUrl) {
  try {
    const resend = getResendClient();

    // Ensure email is a clean string
    const toEmail = String(email).trim();

    console.log('Sending email to:', toEmail);
    console.log('From:', FROM_EMAIL);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: 'Reset your FPL Dashboard password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #37003c 0%, #04f5ff 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">FPL Dashboard</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #37003c; margin-top: 0;">Reset Your Password</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #00ff87; color: #37003c; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; margin-bottom: 0;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #999; font-size: 12px; word-break: break-all;">${resetUrl}</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error };
  }
}
