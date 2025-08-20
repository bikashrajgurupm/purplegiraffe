// app/api/auth/verify/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log('Verification attempt with token:', token?.substring(0, 10) + '...');

    if (!token) {
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid-token`);
    }

    // Find user with this verification token
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (error || !user) {
      console.error('Token lookup error:', error);
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid-token`);
    }

    console.log('Found user:', user.email, 'Current verified status:', user.email_verified);

    // Check if token is expired
    const tokenExpiry = new Date(user.verification_expiry);
    if (tokenExpiry < new Date()) {
      console.log('Token expired for user:', user.email);
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=token-expired`);
    }

    // Check if already verified
    if (user.email_verified) {
      console.log('User already verified:', user.email);
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?message=already-verified&email=${encodeURIComponent(user.email)}`);
    }

    // Update user as verified and ensure they're on free tier
    console.log('Verifying user:', user.email);
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token: null,
        verification_expiry: null,
        subscription_tier: 'free', // Ensure they're on free tier (Community Member)
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Verification update error:', updateError);
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=verification-failed`);
    }

    console.log('User verified successfully:', updatedUser.email, 'Verified status:', updatedUser.email_verified);

    // Redirect to app with success message
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?verified=true&email=${encodeURIComponent(user.email)}`);

  } catch (error) {
    console.error('Verification error:', error);
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=verification-failed`);
  }
}
