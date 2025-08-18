import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  try {
    const { email, sessionId } = await request.json();

    if (!email || !sessionId) {
      return Response.json({ error: 'Email and sessionId required' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!existingUser) {
      // Create new user
      await supabase
        .from('users')
        .insert([{
          email,
          subscription_tier: 'free',
          created_at: new Date().toISOString()
        }]);
    }

    // Update session with email captured
    await supabase
      .from('sessions')
      .update({ 
        email_captured: true, 
        email,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    return Response.json({ success: true, message: 'Email captured successfully' });
  } catch (error) {
    console.error('Email capture error:', error);
    return Response.json({ error: 'Failed to capture email' }, { status: 500 });
  }
}
