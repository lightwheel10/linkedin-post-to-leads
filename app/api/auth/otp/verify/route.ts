import { NextResponse } from 'next/server';
import { hashOTP, verifyOTPInternal, OTP_CONSTANTS } from '@/lib/auth-store';
import { SignJWT } from 'jose';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp || otp.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    // 1. Reconstruct hash from input
    const submittedHash = hashOTP(otp, email, OTP_CONSTANTS.SECRET);

    // 2. Verify (Handles expiration, attempts, locking, cleanup)
    const result = await verifyOTPInternal(email, submittedHash);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.locked ? 423 : 401 } // 423 Locked, 401 Unauthorized
      );
    }

    // 3. Create Session (JWT)
    const secret = new TextEncoder().encode(OTP_CONSTANTS.SECRET);
    const token = await new SignJWT({ email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // 4. Set Cookie
    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('OTP Verify Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

