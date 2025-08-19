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

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return Response.json({ 
        error: 'Please verify your email before logging in',
        requiresVerification: true 
      }, { status: 403 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
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
    return Response.json({ error: 'Failed to login' }, { status: 500 });
  }
}
