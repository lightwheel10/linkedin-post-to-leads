import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role client to bypass RLS for inserts
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        // Validate email
        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Please enter a valid email address' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const { data: existing } = await supabase
            .from('waitlist')
            .select('email')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'You\'re already on the waitlist!' },
                { status: 409 }
            );
        }

        // Insert new waitlist entry
        const { error } = await supabase
            .from('waitlist')
            .insert({ email: email.toLowerCase().trim() });

        if (error) {
            console.error('Waitlist insert error:', error);
            return NextResponse.json(
                { error: 'Something went wrong. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Waitlist API error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}

// GET endpoint to fetch waitlist count (for social proof)
export async function GET() {
    try {
        const { count, error } = await supabase
            .from('waitlist')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Waitlist count error:', error);
            return NextResponse.json({ count: 0 });
        }

        return NextResponse.json({ count: count || 0 });

    } catch (error) {
        console.error('Waitlist count API error:', error);
        return NextResponse.json({ count: 0 });
    }
}
