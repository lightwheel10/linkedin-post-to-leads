/**
 * Supabase Middleware Client
 *
 * MIGRATION NOTE: This file was created as part of the Supabase Auth migration.
 * This module handles session refresh and route protection in the middleware.
 *
 * Key responsibilities:
 * 1. Refresh expired sessions automatically
 * 2. Protect routes that require authentication
 * 3. Redirect authenticated users away from auth pages
 *
 * UPDATE (2nd Jan 2026) - Checkout Callback Route:
 * ================================================
 * Added /checkout/callback and /api/checkout/status to unprotected paths.
 *
 * WHY: When users return from Dodo payment checkout, their session cookies
 * might not be sent due to browser cross-origin policies. If we required auth
 * on the callback route, users would be redirected to /login, breaking the flow.
 *
 * SECURITY: These routes don't complete any sensitive operations based on
 * the request alone. They check the checkout_sessions table (updated by webhook)
 * to verify payment succeeded. Only the webhook can mark sessions as 'completed'.
 *
 * @see SUPABASE_AUTH_MIGRATION.md for full migration documentation
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates the user session and handles route protection.
 * Called by the root middleware.ts on every request.
 * 
 * Protected paths: /dashboard, /onboarding, /api/user, /api/analyses, /api/crm, /api/billing, /api/onboarding
 * Auth paths (redirect if logged in): /login, /signup
 */
export async function updateSession(request: NextRequest) {
  // Create initial response
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create Supabase client with cookie handling for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update request cookies
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // Create new response with updated request
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Set cookies on response
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add any code between createServerClient and supabase.auth.getUser()
  // This ensures the session is refreshed before we check the user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // =========================================================================
  // UNPROTECTED PATHS (2nd Jan 2026)
  // =========================================================================
  // These routes are intentionally unprotected for specific reasons:
  //
  // /checkout/callback - Returns from Dodo payment, session may be lost
  // /api/checkout/status - Polling endpoint for callback page
  //
  // SECURITY: These routes verify payment via webhook-updated DB records,
  // not via URL params. They don't perform sensitive ops without verification.
  // =========================================================================
  const unprotectedPaths = [
    '/checkout/callback',
    '/api/checkout/status',
  ]

  const isUnprotectedPath = unprotectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Skip protection for explicitly unprotected paths
  if (isUnprotectedPath) {
    return supabaseResponse
  }

  // Define protected routes that require authentication
  const protectedPaths = [
    '/dashboard',
    '/onboarding',
    '/api/user',
    '/api/analyses',
    '/api/crm',
    '/api/billing',
    '/api/onboarding'
  ]

  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Redirect to login if accessing protected route without auth
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Define auth pages (login, signup)
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => 
    request.nextUrl.pathname === path
  )

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

