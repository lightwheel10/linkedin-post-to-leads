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
 * - Magic link email (one-click sign in from email)
 * - OAuth support (Google, LinkedIn)
 * - Simpler UX - no OTP code to type
 * - Uses Supabase Auth's built-in flows
 * 
 * @see SUPABASE_AUTH_MIGRATION.md for full migration documentation
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, ArrowRight, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

interface AuthFormProps {
  mode?: 'login' | 'signup'
}

export function AuthForm({ mode = 'login' }: AuthFormProps) {
  const isSignup = mode === 'signup'
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  // Create Supabase client for browser
  const supabase = createClient()

  /**
   * Handle magic link sign in.
   * Sends a magic link to the user's email that they can click to sign in.
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Redirect to auth callback which will handle session and redirect
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
   * Handle Google OAuth sign in.
   * Redirects to Google for authentication, then back to /auth/callback.
   */
  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  /**
   * Handle LinkedIn OAuth sign in.
   * Uses linkedin_oidc provider (OpenID Connect).
   * Redirects to LinkedIn for authentication, then back to /auth/callback.
   */
  const handleLinkedInSignIn = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with LinkedIn'
      setError(errorMessage)
      setIsLoading(false)
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
              We&apos;ve sent a magic link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in your email to sign in. The link expires in 1 hour.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setEmailSent(false)}
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
          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="h-11"
            >
              {/* Google Icon SVG */}
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              onClick={handleLinkedInSignIn}
              disabled={isLoading}
              className="h-11"
            >
              {/* LinkedIn Icon SVG */}
              <svg className="mr-2 h-4 w-4" fill="#0A66C2" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

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
