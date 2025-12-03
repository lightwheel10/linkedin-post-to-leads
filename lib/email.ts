import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email: string, otp: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log('---------------------------------------------------');
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    console.log('Configure RESEND_API_KEY to send real emails.');
    console.log('---------------------------------------------------');
    return { success: true, dev: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Security <security@spectrumailabs.com>', // Updated to verified domain
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify your email address</h2>
          <p>Please use the following code to complete your verification:</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Resend Error:', error);
      throw new Error(error.message);
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('Email Send Error:', err);
    throw err;
  }
}
