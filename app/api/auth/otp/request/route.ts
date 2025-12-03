import { NextResponse } from 'next/server';
import { canRequestOTP, generateOTP, hashOTP, storeOTP, OTP_CONSTANTS } from '@/lib/auth-store';
import { sendOTPEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // 1. Rate Limiting Check
    const limitCheck = await canRequestOTP(email);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.error },
        { status: 429 }
      );
    }

    // 2. Generate secure OTP
    const otp = generateOTP();

    // 3. Hash OTP for storage (never store plain text)
    const hashedOtp = hashOTP(otp, email, OTP_CONSTANTS.SECRET);

    // 4. Store OTP with expiration
    await storeOTP(email, hashedOtp);

    // 5. Send Email (Integrate Resend)
    await sendOTPEmail(email, otp);

    // 6. Return generic success (mask existence/status)
    return NextResponse.json({ 
      message: 'If an account exists with this email, a verification code has been sent.' 
    });

  } catch (error: any) {
    console.error('OTP Request Error:', error);
    
    // Pass through specific Resend configuration errors in development
    if (error.message && error.message.includes('own email address') && process.env.NODE_ENV === 'development') {
       return NextResponse.json(
        { error: `Dev Mode Error: ${error.message}` },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
