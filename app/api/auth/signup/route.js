// app/api/auth/signup/route.js - DEBUG VERSION
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Check if environment variables exist
console.log('Environment check:', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
  hasJwtSecret: !!process.env.JWT_SECRET,
  hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
  hasResendKey: !!process.env.RESEND_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Simple email function for now (without Resend to isolate the issue)
async function sendVerificationEmail(email, token) {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`;
  console.log('================================');
  console.log('VERIFICATION LINK FOR:', email);
  console.log(verificationLink);
  console.log('================================');
  return true;
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Signup request received for:', body.email);
    
    const { email, password, sessionId } = body;

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (password.length < 6) {
      console.log('Password too short');
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    console.log('Checking for existing user:', normalizedEmail);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
    }

    if (existingUser) {
      console.log('User already exists:', normalizedEmail);
      return Response.json({ error: 'Email already registered. Please login.' }, { status: 400 });
    }

    console.log('Creating new user...');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user - with minimal fields first
    const userData = {
      email: normalizedEmail,
      password_hash: hashedPassword,
      email_verified: false,
      verification_token: verificationToken,
      verification_expiry: verificationExpiry.toISOString(),
      created_at: new Date().toISOString()
    };

    console.log('Inserting user with data:', { ...userData, password_hash: '[HIDDEN]' });

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (createError) {
      console.error('User creation error details:', createError);
      return Response.json({ 
        error: 'Failed to create account. Database error.', 
        details: createError.message 
      }, { status: 500 });
    }

    console.log('User created successfully:', newUser.id);

    // Link session to user if sessionId provided
    if (sessionId) {
      console.log('Linking session:', sessionId);
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ 
          user_id: newUser.id,
          email: normalizedEmail,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
      
      if (sessionError) {
        console.error('Session update error:', sessionError);
      }
    }

    // Send verification email
    await sendVerificationEmail(normalizedEmail, verificationToken);

    return Response.json({ 
      message: 'Account created! Please check your email to verify your account.',
      requiresVerification: true,
      email: normalizedEmail
    });

  } catch (error) {
    console.error('Signup error - Full details:', error);
    return Response.json({ 
      error: 'Failed to create account.', 
      details: error.message 
    }, { status: 500 });
  }
}
