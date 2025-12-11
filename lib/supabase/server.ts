/**
 * Supabase Server Client
 * 
 * MIGRATION NOTE: This file was created as part of the Supabase Auth migration.
 * Use this client in Server Components, API Routes, and Server Actions.
 * 
 * This client reads/writes auth cookies on the server side for session management.
 * 
 * @see SUPABASE_AUTH_MIGRATION.md for full migration documentation
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for use in server-side code.
 * This client is used for:
 * - Verifying user authentication in API routes
 * - Getting user data in Server Components
 * - Server Actions that need auth
 * 
 * IMPORTANT: This function is async because it needs to access cookies().
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
            // The middleware will handle session refresh.
          }
        },
      },
    }
  )
}

