// app/api/auth/verify/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  try {
    // Use NextRequest to get search params
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://purplegiraffe.ai';
    
    if (!token) {
      return NextResponse.redirect(new URL('/?error=invalid-token', baseUrl));
    }
    
    // Update user with this token
    const { data, error } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token: null,
        verification_expiry: null,
        subscription_tier: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('verification_token', token)
      .select('email')
      .single();
    
    if (error || !data) {
      console.error('Verification error:', error);
      return NextResponse.redirect(new URL('/?error=verification-failed', baseUrl));
    }
    
    // Success - redirect with email
    return NextResponse.redirect(new URL(`/?verified=true&email=${encodeURIComponent(data.email)}`, baseUrl));
    
  } catch (error) {
    console.error('Critical error in verify route:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://purplegiraffe.ai';
    return NextResponse.redirect(new URL('/?error=verification-failed', baseUrl));
  }
}
