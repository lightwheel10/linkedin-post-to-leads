/**
 * Auth Callback Route Handler
 * 
 * MIGRATION NOTE: This file was created as part of the Supabase Auth migration.
 * This route handles the OAuth/magic link callback from Supabase Auth.
 * 
 * Flow:
 * 1. User clicks magic link email or completes OAuth (Google/LinkedIn)
 * 2. Supabase redirects to this route with an auth code
 * 3. This route exchanges the code for a session
 * 4. User is redirected to dashboard or onboarding based on their status
 * 
 * @see SUPABASE_AUTH_MIGRATION.md for full migration documentation
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  
  // Get the auth code from the URL (sent by Supabase after OAuth/magic link)
  const code = searchParams.get('code')
  
  // Get the 'next' parameter for custom redirect, default to dashboard
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    
    // Exchange the auth code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if user needs onboarding by looking at their app user record
        const { data: appUser } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('email', user.email)
          .single()

        // Redirect to onboarding if not completed or user doesn't exist yet
        // (The database trigger will create the user, but we check here for redirect logic)
        if (!appUser || !appUser.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      // User is authenticated and has completed onboarding - go to dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there was an error or no code, redirect to an error page
  // You may want to create this page or redirect to login with an error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}

