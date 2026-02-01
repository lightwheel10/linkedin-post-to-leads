// Checkout callback — intentionally unprotected (auth cookies may be lost after Dodo redirect).
// Polls /api/checkout/status until webhook marks session completed. Never trusts URL params.

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, AlertCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type CheckoutStatus = 'verifying' | 'completing' | 'success' | 'failed' | 'session_lost' | 'expired';

interface StatusResponse {
  success: boolean;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  message?: string;
  user_email?: string;
  plan_id?: string;
  requires_login?: boolean;
}

function CheckoutCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackToken = searchParams.get('token');

  const [status, setStatus] = useState<CheckoutStatus>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // Poll /api/checkout/status until webhook marks session completed.
  // Uses recursive setTimeout with local pollCount (not state) for proper 2s/4s/6s backoff.
  useEffect(() => {
    if (status !== 'verifying') return;

    if (!callbackToken) {
      setStatus('failed');
      setMessage('Invalid callback URL. Please try again from the pricing page.');
      return;
    }

    let cancelled = false;
    let pollCount = 0;

    async function poll() {
      if (cancelled) return;

      if (pollCount >= 90) {
        setStatus('failed');
        setMessage('Verification timed out. Your payment is safe — please check your email or contact support.');
        return;
      }

      try {
        const res = await fetch(`/api/checkout/status?token=${callbackToken}`);
        const data: StatusResponse = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setStatus('failed');
          setMessage(data.message || 'Unable to verify payment. Please contact support.');
          return;
        }

        if (data.status === 'completed') {
          if (data.requires_login) {
            setStatus('session_lost');
            setUserEmail(data.user_email || null);
            setMessage('Payment confirmed! Please log in to access your account.');
          } else {
            setStatus('completing');
            setMessage('Payment confirmed! Setting up your account...');

            try {
              const completeRes = await fetch('/api/onboarding/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              });

              if (completeRes.ok) {
                setStatus('success');
                setMessage('Welcome! Redirecting to your dashboard...');
                setTimeout(() => {
                  router.replace('/dashboard?welcome=true');
                }, 1500);
              } else {
                const errorData = await completeRes.json();
                if (completeRes.status === 401) {
                  setStatus('session_lost');
                  setUserEmail(data.user_email || null);
                  setMessage('Payment confirmed! Please log in to access your account.');
                } else {
                  throw new Error(errorData.error || 'Failed to complete setup');
                }
              }
            } catch (err: any) {
              console.error('Failed to complete onboarding:', err);
              setStatus('session_lost');
              setUserEmail(data.user_email || null);
              setMessage('Payment confirmed! Please log in to complete setup.');
            }
          }
          return;
        }

        if (data.status === 'failed') {
          setStatus('failed');
          setMessage(data.message || 'Payment failed. Please try again.');
          return;
        }

        if (data.status === 'expired') {
          setStatus('expired');
          setMessage('This checkout session has expired. Please try again.');
          return;
        }

        // Still pending — schedule next poll with backoff
        pollCount++;
        if (pollCount > 60) {
          setMessage('Still verifying... Taking longer than expected. Your payment is safe.');
        } else if (pollCount > 30) {
          setMessage('Still verifying... Please wait.');
        } else if (pollCount > 5) {
          setMessage('Waiting for payment confirmation...');
        }

        const interval = pollCount < 30 ? 2000 : pollCount < 60 ? 4000 : 6000;
        setTimeout(poll, interval);
      } catch (err) {
        if (cancelled) return;
        console.error('Error checking status:', err);
        pollCount++;

        if (pollCount > 45) {
          setStatus('failed');
          setMessage('Unable to verify payment. Please check your email or contact support.');
          return;
        }

        setTimeout(poll, 2000);
      }
    }

    const initialDelay = setTimeout(poll, 500);

    return () => {
      cancelled = true;
      clearTimeout(initialDelay);
    };
  }, [status, callbackToken, router]);

  const handleLoginRedirect = () => {
    router.push('/login?next=/dashboard&welcome=true');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full shadow-xl border-border/50">
        <CardHeader className="text-center pb-2">
          {/* Status Icon */}
          <div className="mx-auto mb-4">
            {status === 'verifying' && (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            {status === 'completing' && (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center animate-scale-in">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            )}
            {status === 'session_lost' && (
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
            )}
            {(status === 'failed' || status === 'expired') && (
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            )}
          </div>

          <CardTitle className="text-xl">
            {status === 'verifying' && 'Verifying Payment'}
            {status === 'completing' && 'Setting Up Account'}
            {status === 'success' && 'Welcome!'}
            {status === 'session_lost' && 'Payment Confirmed!'}
            {status === 'failed' && 'Payment Issue'}
            {status === 'expired' && 'Session Expired'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Session lost - show login button */}
          {status === 'session_lost' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Your payment was successful and your account is ready.
                {userEmail && (
                  <span className="block mt-1 font-medium text-foreground">
                    Email: {userEmail}
                  </span>
                )}
              </p>
              <Button onClick={handleLoginRedirect} className="w-full h-11">
                <LogIn className="mr-2 h-4 w-4" />
                Log In to Dashboard
              </Button>
            </div>
          )}

          {/* Failed or expired - show retry button */}
          {(status === 'failed' || status === 'expired') && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                If you believe this is an error, please check your email for a
                confirmation or contact our support team.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/onboarding')}
                  className="flex-1 h-11"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.href = 'mailto:support@guffles.com'}
                  className="flex-1 h-11"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          )}

          {/* Verifying - show progress indicator */}
          {status === 'verifying' && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/30 animate-pulse"
                      style={{ animationDelay: `${i * 200}ms` }}
                    />
                  ))}
                </div>
                <span>Please wait...</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                This usually takes just a few seconds.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutCallbackContent />
    </Suspense>
  );
}
