'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ArrowRight, Mail, RotateCw, ArrowLeft } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface AuthFormProps {
  mode?: 'login' | 'signup';
}

export function AuthForm({ mode = 'login' }: AuthFormProps) {
  const isSignup = mode === 'signup';
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Cooldown logic
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send code');
      }

      setStep('otp');
      setResendCooldown(15); // Start 15s cooldown
      setOtp(''); // Clear previous OTP input
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (code: string) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Redirect based on server response (handles onboarding status)
      window.location.href = data.redirectTo || '/dashboard';
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false); 
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      verifyOTP(value);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-md mb-4">
        <Link 
          href="/" 
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
        </Link>
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === 'email' 
              ? (isSignup ? 'Start your free trial' : 'Welcome back')
              : 'Check your inbox'}
          </CardTitle>
          <CardDescription>
            {step === 'email' 
              ? (isSignup 
                  ? 'Enter your email to start your 7-day free trial'
                  : 'Enter your email to receive a secure verification code')
              : `We've sent a 6-digit code to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continue with Email
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center py-4">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              
              {error && (
                 <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md justify-center">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {isLoading && (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleRequestOTP()}
                    disabled={isLoading || resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? (
                        <span className="text-muted-foreground">Resend code in {resendCooldown}s</span>
                    ) : (
                        <>
                          <RotateCw className="mr-2 h-4 w-4" />
                          Resend Code
                        </>
                    )}
                  </Button>

                  <Button 
                    variant="ghost" 
                    type="button" 
                    className="w-full" 
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setError('');
                      setResendCooldown(0);
                    }}
                    disabled={isLoading}
                  >
                    Use a different email
                  </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
          <p className="text-sm text-muted-foreground">
            {isSignup ? (
              <>Already have an account? <Link href="/waitlist" className="text-primary hover:underline">Sign in</Link></>
            ) : (
              <>Don't have an account? <Link href="/waitlist" className="text-primary hover:underline">Start free trial</Link></>
            )}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
