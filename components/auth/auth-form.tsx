/**
 * Authentication Form Component
 * 
 * MIGRATION NOTE: This file was REPLACED as part of the Supabase Auth migration.
 * 
 * BEFORE (Old Implementation):
 * - Two-step flow: Email -> 6-digit OTP code
 * - Used custom OTP endpoints (/api/auth/otp/request and /api/auth/otp/verify)
 * - Required manual OTP entry with InputOTP component
 * 
 * AFTER (New Implementation - Supabase Auth):
 * - Magic link email + 6-digit OTP code (Google OAuth removed)
 * - User can either click the link or type the code
 * - Uses Supabase Auth's built-in flows
 * 
 * @see SUPABASE_AUTH_MIGRATION.md for full migration documentation
 */

'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, ArrowRight, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { trackSignupMethod } from '@/lib/analytics'

interface AuthFormProps {
  mode?: 'login' | 'signup'
}

export function AuthForm({ mode = 'login' }: AuthFormProps) {
  const isSignup = mode === 'signup'
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Create Supabase client for browser
  const supabase = createClient()

  // Get the site URL - use env var for production, fallback to window.location.origin for local dev
  const getSiteUrl = () => {
    // In production, always use the configured site URL
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL
    }
    // Fallback for local development
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return 'http://localhost:3000'
  }

  /**
   * Handle magic link sign in.
   * Sends a magic link to the user's email that they can click to sign in.
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Track the email signup method
    trackSignupMethod('email', isSignup ? 'signup' : 'login')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Redirect to auth callback which will handle session and redirect
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send magic link'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle OTP input change with auto-focus to next field.
   */
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste: distribute digits across fields
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otp]
      digits.forEach((digit, i) => {
        if (index + i < 6) newOtp[index + i] = digit
      })
      setOtp(newOtp)
      const focusIndex = Math.min(index + digits.length, 5)
      otpRefs.current[focusIndex]?.focus()
      return
    }

    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  /**
   * Verify the 6-digit OTP code.
   * On success, redirect to dashboard or onboarding.
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = otp.join('')
    if (token.length !== 6) return

    setIsVerifying(true)
    setError('')

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (error) throw error

      // Check onboarding status and redirect
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: appUser } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('email', user.email)
          .single()

        if (!appUser || !appUser.onboarding_completed) {
          router.push('/onboarding')
          return
        }
      }
      router.push('/dashboard')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid code. Please try again.'
      setError(errorMessage)
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  // Show "Check your email" screen after magic link is sent
  if (emailSent) {
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
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Check your email
            </CardTitle>
            <CardDescription>
              We&apos;ve sent a code to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* OTP Input */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-11 h-13 text-center text-xl font-semibold rounded-lg border border-input bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={isVerifying || otp.join('').length !== 6}>
                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify Code
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center">
              You can also click the magic link in your email to sign in.
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setEmailSent(false); setOtp(['', '', '', '', '', '']); setError('') }}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main auth form
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
            {isSignup ? 'Start your free trial' : 'Welcome back'}
          </CardTitle>
          <CardDescription>
            {isSignup
              ? 'Enter your email to start your 7-day free trial'
              : 'Sign in to your account to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Form - Magic Link */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue with Email
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
          <p className="text-sm text-muted-foreground">
            {isSignup ? (
              <>Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link></>
            ) : (
              <>Don&apos;t have an account? <Link href="/signup" className="text-primary hover:underline">Start free trial</Link></>
            )}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
