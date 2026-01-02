// =============================================================================
// CHECKOUT CALLBACK PAGE
// =============================================================================
//
// Created: 2nd January 2026
// Purpose: Handle return from Dodo checkout without requiring authentication
//
// WHY THIS PAGE EXISTS:
// ====================
// When users complete payment on Dodo's hosted checkout and are redirected back,
// their auth session cookies might not be sent due to browser security policies
// (SameSite cookies, ITP in Safari, etc.). If we redirected to a protected route
// like /onboarding, the middleware would see no session and redirect to /login.
//
// This page is INTENTIONALLY unprotected. It:
// 1. Receives the session_id from the URL (from Dodo's redirect)
// 2. Polls /api/checkout/status to check if the WEBHOOK has confirmed payment
// 3. Once confirmed, completes onboarding and redirects to dashboard
// 4. Handles the case where user's auth session was lost gracefully
//
// SECURITY MODEL:
// ==============
// - We NEVER trust the URL params to mean "payment succeeded"
// - The session_id is only used to look up the checkout session in our DB
// - Only the WEBHOOK (with signature verification) can mark status = 'completed'
// - Even if someone guesses a session_id, they can't complete onboarding
//   unless the webhook has actually confirmed payment
//
// =============================================================================

'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, AlertCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// =============================================================================
// TYPES
// =============================================================================

type CheckoutStatus = 'verifying' | 'completing' | 'success' | 'failed' | 'session_lost' | 'expired';

interface StatusResponse {
  success: boolean;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  message?: string;
  user_email?: string;
  plan_id?: string;
  requires_login?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function CheckoutCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Updated 2nd Jan 2026: Use 'token' instead of 'session_id'
  // Dodo doesn't replace {CHECKOUT_SESSION_ID} placeholders, so we use our own token
  const callbackToken = searchParams.get('token');

  const [status, setStatus] = useState<CheckoutStatus>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // =========================================================================
  // Poll for checkout status
  // =========================================================================
  // We poll the status endpoint which checks:
  // 1. If the checkout session exists in our DB (looked up by callback_token)
  // 2. If the WEBHOOK has marked it as 'completed'
  // 3. If the user is authenticated (for seamless redirect)
  // =========================================================================
  const checkStatus = useCallback(async () => {
    if (!callbackToken) {
      setStatus('failed');
      setMessage('Invalid callback URL. Please try again from the pricing page.');
      return;
    }

    try {
      const res = await fetch(`/api/checkout/status?token=${callbackToken}`);
      const data: StatusResponse = await res.json();

      if (!res.ok) {
        // Session not found or other error
        setStatus('failed');
        setMessage(data.message || 'Unable to verify payment. Please contact support.');
        return;
      }

      if (data.status === 'completed') {
        // =====================================================================
        // Payment confirmed by webhook!
        // =====================================================================
        if (data.requires_login) {
          // User's auth session was lost during redirect
          // Show message to log in (their payment is safe)
          setStatus('session_lost');
          setUserEmail(data.user_email || null);
          setMessage('Payment confirmed! Please log in to access your account.');
        } else {
          // User is still authenticated - complete onboarding
          setStatus('completing');
          setMessage('Payment confirmed! Setting up your account...');

          // Call complete onboarding endpoint
          try {
            const completeRes = await fetch('/api/onboarding/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (completeRes.ok) {
              setStatus('success');
              setMessage('Welcome! Redirecting to your dashboard...');
              // Small delay to show success message
              setTimeout(() => {
                router.replace('/dashboard?welcome=true');
              }, 1500);
            } else {
              // If complete fails, they might need to log in
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
      } else if (data.status === 'pending') {
        // Still waiting for webhook - keep polling
        setPollCount((prev) => prev + 1);

        // Update message based on poll count
        if (pollCount > 10) {
          setMessage('Still verifying... This is taking longer than expected.');
        } else if (pollCount > 5) {
          setMessage('Waiting for payment confirmation...');
        }
      } else if (data.status === 'failed') {
        setStatus('failed');
        setMessage(data.message || 'Payment failed. Please try again.');
      } else if (data.status === 'expired') {
        setStatus('expired');
        setMessage('This checkout session has expired. Please try again.');
      }
    } catch (err) {
      console.error('Error checking status:', err);
      // Don't immediately fail - could be a temporary network issue
      setPollCount((prev) => prev + 1);
      if (pollCount > 15) {
        setStatus('failed');
        setMessage('Unable to verify payment. Please check your email or contact support.');
      }
    }
  }, [callbackToken, pollCount, router]);

  // =========================================================================
  // Polling effect
  // =========================================================================
  useEffect(() => {
    if (status !== 'verifying') return;

    // Initial check
    checkStatus();

    // Poll every 2 seconds for up to 60 seconds
    const pollInterval = setInterval(() => {
      if (pollCount < 30) {
        // 30 polls * 2 seconds = 60 seconds max
        checkStatus();
      } else {
        clearInterval(pollInterval);
        setStatus('failed');
        setMessage('Verification timed out. Your payment may still have succeeded - please check your email or contact support.');
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [status, checkStatus, pollCount]);

  // =========================================================================
  // Handle login redirect
  // =========================================================================
  const handleLoginRedirect = () => {
    // Redirect to login with return URL to dashboard
    // The user's onboarding will be marked complete by the checkout status check
    router.push('/login?next=/dashboard&welcome=true');
  };

  // =========================================================================
  // Render
  // =========================================================================
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

// =============================================================================
// EXPORT WITH SUSPENSE
// =============================================================================
// Wrap in Suspense for useSearchParams()

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
