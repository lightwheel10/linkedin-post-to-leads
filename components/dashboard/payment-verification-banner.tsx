'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CheckoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

interface CheckoutStatusResponse {
  success: boolean;
  status: CheckoutStatus;
  message?: string;
}

interface PaymentVerificationBannerProps {
  callbackToken: string;
}

export function PaymentVerificationBanner({ callbackToken }: PaymentVerificationBannerProps) {
  const router = useRouter();
  const hasRefreshedRef = useRef(false);
  const [status, setStatus] = useState<CheckoutStatus>('processing');
  const [message, setMessage] = useState('Checking automatically with Dodo...');

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function checkStatus() {
      if (cancelled || document.hidden) {
        scheduleNextCheck();
        return;
      }

      try {
        const response = await fetch(`/api/checkout/status?token=${callbackToken}`, {
          cache: 'no-store',
        });
        const data: CheckoutStatusResponse = await response.json();

        if (cancelled) return;

        setStatus(data.status);

        if (data.status === 'completed') {
          setMessage('Trial activated. Refreshing your dashboard...');

          if (!hasRefreshedRef.current) {
            hasRefreshedRef.current = true;
            setTimeout(() => router.refresh(), 1200);
          }
          return;
        }

        if (data.status === 'failed' || data.status === 'expired') {
          setMessage(data.message || 'Payment could not be verified.');
          return;
        }

        setMessage(data.message || 'Payment verification is still processing.');
        scheduleNextCheck();
      } catch {
        if (cancelled) return;
        setStatus('processing');
        setMessage('Still checking with Dodo. This may take a few minutes.');
        scheduleNextCheck();
      }
    }

    function scheduleNextCheck() {
      timeoutId = setTimeout(checkStatus, 15000);
    }

    // 2026-05-17 13:36:52 +05:30, paras: Auto-poll Dodo so pending Indian-card verification updates without manual clicks.
    const initialDelay = setTimeout(checkStatus, 1500);

    return () => {
      cancelled = true;
      clearTimeout(initialDelay);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [callbackToken, router]);

  const isDone = status === 'completed';
  const isFailed = status === 'failed' || status === 'expired';
  const Icon = isDone ? CheckCircle2 : isFailed ? XCircle : Loader2;

  return (
    <div
      className={`rounded-lg border p-4 ${
        isDone
          ? 'border-emerald-500/30 bg-emerald-500/10'
          : isFailed
            ? 'border-red-500/30 bg-red-500/10'
            : 'border-amber-500/30 bg-amber-500/10'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`rounded-md p-1.5 mt-0.5 ${
              isDone
                ? 'bg-emerald-500/15'
                : isFailed
                  ? 'bg-red-500/15'
                  : 'bg-amber-500/15'
            }`}
          >
            {isFailed ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <Icon
                className={`h-4 w-4 ${
                  isDone ? 'text-emerald-600' : 'text-amber-600 animate-spin'
                }`}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {isDone
                ? 'Trial activated'
                : isFailed
                  ? 'Payment verification failed'
                  : 'Payment verification is still processing'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {message}
            </p>
            {!isDone && !isFailed && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Your trial wallet will unlock automatically after Dodo confirms the payment.
              </p>
            )}
          </div>
        </div>

        {isFailed ? (
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => router.push('/onboarding')}>
            Try Again
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {!isDone && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isDone ? 'Updating...' : 'Checking automatically'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
