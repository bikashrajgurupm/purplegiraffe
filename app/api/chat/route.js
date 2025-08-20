import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;
const QUESTION_LIMIT = 10;

async function getOrCreateThread(sessionId, userId = null) {
  // First, check database for existing thread
  const { data: session } = await supabase
    .from('sessions')
    .select('thread_id')
    .eq('session_id', sessionId)
    .single();
  
  if (session?.thread_id) {
    // Verify thread still exists in OpenAI
    try {
      await openai.beta.threads.retrieve(session.thread_id);
      return session.thread_id;
    } catch (error) {
      console.log('Thread no longer exists in OpenAI, creating new one');
    }
  }
  
  // Create new thread
  const thread = await openai.beta.threads.create();
  
  // Update session with new thread ID
  await supabase
    .from('sessions')
    .update({ 
      thread_id: thread.id,
      user_id: userId,
      updated_at: new Date().toISOString()
    })
    .eq('session_id', sessionId);
  
  return thread.id;
}

async function getUserFromToken(token) {
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();
    
    return user;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();
    
    // Get user from auth header if present
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = await getUserFromToken(token);

    if (!message || !sessionId) {
      return Response.json({ error: 'Message and sessionId required' }, { status: 400 });
    }

    // Get or create session
    let session;
    const { data: existingSession, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError) {
      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('sessions')
        .insert([{ 
          session_id: sessionId, 
          question_count: 0,
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      session = newSession;
    } else {
      session = existingSession;
      
      // Update user_id if user just logged in
      if (user && !session.user_id) {
        await supabase
          .from('sessions')
          .update({ user_id: user.id })
          .eq('session_id', sessionId);
      }
    }

    // Check question limits for non-logged-in users
    if (!user && session.question_count >= QUESTION_LIMIT) {
      return Response.json({ 
        error: 'Question limit reached. Please sign up to continue.',
        questionCount: session.question_count,
        remainingQuestions: 0,
        limitReached: true
      }, { status: 403 });
    }

    // Get or create thread for this session
    const threadId = await getOrCreateThread(sessionId, user?.id);

    // Add message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID
    });

    // Wait for completion with better error handling
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    let attempts = 0;
    const maxAttempts = 30;

    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      attempts++;

      if (runStatus.status === 'failed') {
        console.error('Run failed:', runStatus.last_error);
        throw new Error(`Assistant failed: ${runStatus.last_error?.message || 'Unknown error'}`);
      }
      
      if (runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        throw new Error(`Run ${runStatus.status}`);
      }
    }

    if (runStatus.status !== 'completed') {
      throw new Error('Assistant took too long to respond');
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0];
    
    // Extract text from the response
    let aiResponse = '';
    if (lastMessage.content[0].type === 'text') {
      aiResponse = lastMessage.content[0].text.value;
    }

    // Store question and answer in database
    await supabase
      .from('questions')
      .insert([{
        session_id: sessionId,
        user_id: user?.id || null,
        question: message,
        answer: aiResponse,
        thread_id: threadId,
        created_at: new Date().toISOString()
      }]);

    // Update question count and last activity
    const newCount = (session?.question_count || 0) + 1;
    await supabase
      .from('sessions')
      .update({ 
        question_count: newCount,
        thread_id: threadId,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    // Calculate remaining questions
    let remainingQuestions = user ? 999 : Math.max(0, QUESTION_LIMIT - newCount);

    // Update chat history for logged-in users
    if (user) {
      // Check if chat history exists for this session
      const { data: chatHistory } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (chatHistory) {
        // Update existing chat history
        await supabase
          .from('chat_history')
          .update({
            last_message: message,
            message_count: chatHistory.message_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', chatHistory.id);
      } else {
        // Create new chat history entry
        await supabase
          .from('chat_history')
          .insert([{
            user_id: user.id,
            session_id: sessionId,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            last_message: message,
            message_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
      }
    }

    return Response.json({ 
      response: aiResponse,
      questionCount: newCount,
      remainingQuestions,
      threadId: threadId // Useful for debugging
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    // More specific error messages
    if (error.message?.includes('API key')) {
      return Response.json({ 
        error: 'Configuration error. Please contact support.'
      }, { status: 500 });
    }
    
    if (error.message?.includes('Assistant')) {
      return Response.json({ 
        error: 'AI assistant temporarily unavailable. Please try again.'
      }, { status: 503 });
    }
    
    return Response.json({ 
      error: 'Failed to process your message. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
