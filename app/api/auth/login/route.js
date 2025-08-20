// app/api/auth/login/route.js
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // IMPORTANT: Normalize email to lowercase (matching signup)
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('Login attempt for:', normalizedEmail);

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (error || !user) {
      console.log('User not found:', normalizedEmail, 'Error:', error?.message);
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    console.log('User found:', user.email, 'Verified:', user.email_verified);

    // Check if email is verified FIRST (better UX)
    if (!user.email_verified) {
      console.log('Email not verified for:', normalizedEmail);
      return Response.json({ 
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
        requiresVerification: true 
      }, { status: 403 });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      console.log('Invalid password for:', normalizedEmail);
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT token with consistent structure
    const token = jwt.sign(
      { 
        userId: user.id,  // Changed from 'id' to 'userId' to match chat route
        email: user.email, 
        tier: user.subscription_tier 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Update last login
    await supabase
      .from('users')
      .update({ 
        last_login: new Date().toISOString()
      })
      .eq('id', user.id);

    console.log('Login successful for:', normalizedEmail);

    return Response.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        tier: user.subscription_tier,
        email_verified: user.email_verified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ 
      error: 'Failed to login. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
