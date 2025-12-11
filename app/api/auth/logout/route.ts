/**
 * Logout API Route
 * 
 * MIGRATION NOTE: This file was created as part of the Supabase Auth migration.
 * Previously, logout was handled by clearing the auth_token cookie manually.
 * Now we use Supabase Auth's signOut() which properly clears all session data.
 * 
 * Usage from client:
 *   await fetch('/api/auth/logout', { method: 'POST' })
 *   window.location.href = '/login'
 * 
 * @see SUPABASE_AUTH_MIGRATION.md for full migration documentation
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Sign out the user - this clears the session cookies
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    // Return success anyway - user should be logged out even if there's an error
    return NextResponse.json({ success: true })
  }
}

