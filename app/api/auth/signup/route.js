// app/api/auth/signup/route.js
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Function to send verification email (you'll need to set up an email service)
async function sendVerificationEmail(email, token) {
  // For now, we'll just log it. In production, use SendGrid, Resend, or another email service
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`;
  console.log(`Verification link for ${email}: ${verificationLink}`);
  
  // TODO: Implement actual email sending
  // Example with SendGrid:
  // await sendgrid.send({
  //   to: email,
  //   from: 'noreply@purplegiraffe.in',
  //   subject: 'Verify your PurpleGiraffe account',
  //   html: `Click <a href="${verificationLink}">here</a> to verify your email.`
  // });
  
  return true;
}

export async function POST(request) {
  try {
    const { email, password, sessionId } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return Response.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: hashedPassword,
        subscription_tier: 'free',
        email_verified: false,
        verification_token: verificationToken,
        verification_expiry: verificationExpiry.toISOString(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError) {
      console.error('User creation error:', createError);
      return Response.json({ error: 'Failed to create account' }, { status: 500 });
    }

    // Link session to user
    if (sessionId) {
      await supabase
        .from('sessions')
        .update({ 
          user_id: newUser.id,
          email: email,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
    }

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    return Response.json({ 
      message: 'Account created! Please check your email to verify your account.',
      requiresVerification: true
    });

  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
