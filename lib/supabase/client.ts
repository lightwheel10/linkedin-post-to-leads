/**
 * Supabase Browser Client
 * 
 * MIGRATION NOTE: This file was created as part of the Supabase Auth migration.
 * Use this client in Client Components (components with 'use client' directive).
 * 
 * This client handles authentication state in the browser and automatically
 * manages session cookies.
 * 
 * @see SUPABASE_AUTH_MIGRATION.md for full migration documentation
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in browser/client components.
 * This client is used for:
 * - User sign in/sign up (OAuth, magic link)
 * - Sign out
 * - Accessing user session in client components
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

