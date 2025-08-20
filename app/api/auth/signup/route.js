// app/api/auth/signup/route.js
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(email, token) {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;
  
  try {
    // Try to send with Resend
    const { data, error } = await resend.emails.send({
      from: 'PurpleGiraffe <onboarding@resend.dev>', // Change to your domain when verified
      to: email,
      subject: '🦒 Verify your PurpleGiraffe account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B5CF6 0%, #6B46C1 100%); border-radius: 10px 10px 0 0; }
              .logo { font-size: 48px; margin-bottom: 10px; }
              .content { background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
              h1 { color: white; margin: 0; }
              .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8B5CF6 0%, #6B46C1 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 30px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
              .link { color: #8B5CF6; word-break: break-all; font-size: 13px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🦒</div>
                <h1>Welcome to PurpleGiraffe!</h1>
              </div>
              <div class="content">
                <h2>Verify your email address</h2>
                <p>Thanks for signing up! You're one step away from unlocking:</p>
                <ul>
                  <li>✅ <strong>Unlimited questions</strong> with our Community Member tier</li>
                  <li>🚀 Access to advanced monetization insights</li>
                  <li>💜 Community access and knowledge sharing</li>
                </ul>
                <p>Click the button below to verify your email and get started:</p>
                <div style="text-align: center;">
                  <a href="${verificationLink}" class="button">Verify Email Address</a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p class="link">${verificationLink}</p>
                <div class="footer">
                  <p>This verification link will expire in 24 hours.</p>
                  <p>If you didn't create an account, you can safely ignore this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      // Fall back to console logging in development
      console.log('================================');
      console.log('VERIFICATION LINK FOR:', email);
      console.log(verificationLink);
      console.log('================================');
      return false;
    }

    console.log('Verification email sent successfully to:', email);
    return true;
    
  } catch (error) {
    console.error('Email send error:', error);
    // Fall back to console logging
    console.log('================================');
    console.log('VERIFICATION LINK FOR:', email);
    console.log(verificationLink);
    console.log('================================');
    return false;
  }
}

export async function POST(request) {
  try {
    const { email, password, sessionId } = await request.json();

    // Validate input
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      if (!existingUser.email_verified) {
        // Resend verification email with existing token
        await sendVerificationEmail(normalizedEmail, existingUser.verification_token);
        return Response.json({ 
          error: 'Email already registered. We\'ve sent another verification link to your email.' 
        }, { status: 400 });
      }
      return Response.json({ error: 'Email already registered. Please login.' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with 'free' tier (Community Member) but email_verified false
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email: normalizedEmail,
        password_hash: hashedPassword,
        subscription_tier: 'free', // Will be Community Member after verification
        email_verified: false,
        verification_token: verificationToken,
        verification_expiry: verificationExpiry.toISOString(),
        created_at: new Date().toISOString(),
        question_count: 0
      }])
      .select()
      .single();

    if (createError) {
      console.error('User creation error:', createError);
      return Response.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
    }

    // Link existing session to new user (preserve their chat history)
    if (sessionId) {
      await supabase
        .from('sessions')
        .update({ 
          user_id: newUser.id,
          email: normalizedEmail,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
    }

    // Send verification email
    await sendVerificationEmail(normalizedEmail, verificationToken);

    return Response.json({ 
      message: 'Account created! Please check your email to verify your account.',
      requiresVerification: true,
      email: normalizedEmail
    });

  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
