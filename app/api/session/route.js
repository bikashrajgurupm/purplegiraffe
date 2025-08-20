// app/api/session/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return Response.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    // Get or create session
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Session doesn't exist, create new one
      const { data: newSession, error: createError } = await supabase
        .from('sessions')
        .insert([{ 
          session_id: sessionId, 
          question_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error('Session creation error:', createError);
        return Response.json({ error: 'Failed to create session' }, { status: 500 });
      }
      
      return Response.json({ 
        questionCount: 0, 
        remainingQuestions: 10,  // Changed from 3 to 10
        isNew: true
      });
    }

    if (error) throw error;

    // Calculate remaining questions (10 question limit for non-logged in users)
    const remainingQuestions = Math.max(0, 10 - (session?.question_count || 0));
    
    return Response.json({ 
      questionCount: session?.question_count || 0, 
      remainingQuestions,
      userId: session?.user_id || null,
      email: session?.email || null,
      isNew: false
    });
  } catch (error) {
    console.error('Session error:', error);
    return Response.json({ error: 'Failed to manage session' }, { status: 500 });
  }
}
