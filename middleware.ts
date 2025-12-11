/**
 * Next.js Middleware for Supabase Auth
 * 
 * MIGRATION NOTE: This file was created as part of the Supabase Auth migration.
 * Previously, there was no middleware - auth was checked in individual layouts/routes.
 * 
 * This middleware runs on every request and:
 * 1. Refreshes the user's session if needed (prevents session expiry)
 * 2. Protects routes that require authentication
 * 3. Redirects authenticated users away from login/signup pages
 * 
 * @see SUPABASE_AUTH_MIGRATION.md for full migration documentation
 */

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

/**
 * Matcher configuration - defines which routes the middleware runs on.
 * 
 * Excludes:
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * - Public assets (svg, png, jpg, jpeg, gif, webp)
 * 
 * This ensures the middleware only runs on actual page/API requests,
 * not on static assets, for better performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

