/**
 * Authentication Utilities
 * 
 * MIGRATION NOTE: This file was REPLACED as part of the Supabase Auth migration.
 * 
 * BEFORE (Old Implementation):
 * - Used jose library to verify JWT tokens from cookies
 * - JWT was created by our custom OTP verification endpoint
 * - Relied on OTP_SECRET environment variable
 * 
 * AFTER (New Implementation - Supabase Auth):
 * - Uses Supabase Auth for session management
 * - Sessions are automatically managed via cookies by @supabase/ssr
 * - No custom JWT handling needed
 * 
 * The function signatures remain the same to avoid breaking existing code:
 * - getAuthenticatedUser() - returns email or null
 * - requireAuth() - returns email or throws error
 * 
 * @see SUPABASE_AUTH_MIGRATION.md for full migration documentation
 */

import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from './data-store'

/**
 * Gets the authenticated user's email from Supabase Auth session.
 * Returns null if not authenticated.
 * 
 * MIGRATION NOTE: Previously used jwtVerify from jose to verify custom JWT.
 * Now uses Supabase Auth's getUser() which automatically handles session cookies.
 */
export async function getAuthenticatedUser(): Promise<string | null> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user?.email) {
    return null
  }

  return user.email
}

/**
 * Gets the authenticated user with full profile from your users table.
 * Creates user if doesn't exist (for first-time OAuth users).
 * 
 * MIGRATION NOTE: This is a new helper function added during migration.
 * Useful when you need both auth status and user profile data.
 */
export async function getAuthenticatedUserWithProfile() {
  const email = await getAuthenticatedUser()

  if (!email) {
    return null
  }

  return getOrCreateUser(email)
}

/**
 * Requires authentication - throws error if not authenticated.
 * Returns the user's email if authenticated.
 * 
 * MIGRATION NOTE: Function signature unchanged from old implementation.
 * Existing code using requireAuth() will work without changes.
 */
export async function requireAuth(): Promise<string> {
  const email = await getAuthenticatedUser()
  if (!email) {
    throw new Error('Unauthorized')
  }
  return email
}

/**
 * Sign out the current user.
 * 
 * MIGRATION NOTE: This is a new helper function added during migration.
 * Call this from server-side code to sign out the user.
 * For client-side sign out, use the logout API route or supabase client directly.
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
