// app/api/auth/verify/route.js - DEBUG VERSION
import { createClient } from '@supabase/supabase-js';

// Check environment variables
console.log('Verify route - Environment check:', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
  hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  console.log('=== VERIFICATION ATTEMPT START ===');
  
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log('1. Token received:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');

    if (!token) {
      console.log('ERROR: No token provided');
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid-token`);
    }

    // Find user with this verification token
    console.log('2. Looking up user with token...');
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (error) {
      console.error('3. Database lookup error:', error);
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid-token`);
    }

    if (!user) {
      console.log('3. No user found with this token');
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid-token`);
    }

    console.log('3. Found user:', {
      email: user.email,
      id: user.id,
      email_verified: user.email_verified,
      has_token: !!user.verification_token,
      token_matches: user.verification_token === token
    });

    // Check if token is expired
    if (user.verification_expiry) {
      const tokenExpiry = new Date(user.verification_expiry);
      const now = new Date();
      console.log('4. Token expiry check:', {
        expiry: tokenExpiry.toISOString(),
        now: now.toISOString(),
        expired: tokenExpiry < now
      });
      
      if (tokenExpiry < now) {
        console.log('ERROR: Token expired');
        return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=token-expired`);
      }
    } else {
      console.log('4. No expiry date set for token');
    }

    // Check if already verified
    if (user.email_verified === true) {
      console.log('5. User already verified');
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?message=already-verified&email=${encodeURIComponent(user.email)}`);
    }

    // Update user as verified
    console.log('5. Attempting to verify user...');
    const updateData = {
      email_verified: true,
      verification_token: null,
      verification_expiry: null,
      subscription_tier: 'free',
      updated_at: new Date().toISOString()
    };
    
    console.log('6. Update data:', updateData);
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('7. UPDATE ERROR:', updateError);
      console.error('Error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=verification-failed`);
    }

    if (!updatedUser) {
      console.error('7. No data returned after update');
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=verification-failed`);
    }

    console.log('7. User verified successfully:', {
      email: updatedUser.email,
      email_verified: updatedUser.email_verified,
      tier: updatedUser.subscription_tier
    });

    console.log('=== VERIFICATION SUCCESS ===');
    
    // Redirect to app with success message
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/?verified=true&email=${encodeURIComponent(user.email)}`;
    console.log('8. Redirecting to:', redirectUrl);
    
    return Response.redirect(redirectUrl);

  } catch (error) {
    console.error('=== VERIFICATION CRITICAL ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=verification-failed`);
  }
}
