import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  try {
    const { sessionId } = await request.json();
    
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
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) throw createError;
      return Response.json({ questionCount: 0, remainingQuestions: 3 });
    }

    if (error) throw error;

    const remainingQuestions = Math.max(0, 3 - (session?.question_count || 0));
    return Response.json({ 
      questionCount: session?.question_count || 0, 
      remainingQuestions,
      emailCaptured: session?.email_captured || false 
    });
  } catch (error) {
    console.error('Session error:', error);
    return Response.json({ error: 'Failed to manage session' }, { status: 500 });
  }
}
