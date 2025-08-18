import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Your Assistant ID from environment variable
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// Store thread IDs for each session (in production, store in database)
const threadMap = new Map();

async function getOrCreateThread(sessionId) {
  // Check if we have a thread for this session in memory
  if (threadMap.has(sessionId)) {
    return threadMap.get(sessionId);
  }
  
  // Check database for existing thread
  const { data: session } = await supabase
    .from('sessions')
    .select('thread_id')
    .eq('session_id', sessionId)
    .single();
  
  if (session?.thread_id) {
    threadMap.set(sessionId, session.thread_id);
    return session.thread_id;
  }
  
  // Create new thread
  const thread = await openai.beta.threads.create();
  threadMap.set(sessionId, thread.id);
  
  // Store in database
  await supabase
    .from('sessions')
    .update({ thread_id: thread.id })
    .eq('session_id', sessionId);
  
  return thread.id;
}

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();

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
      // Create new session if doesn't exist
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
      session = newSession;
    } else {
      session = existingSession;
    }

    // Get or create thread for this session
    const threadId = await getOrCreateThread(sessionId);

    // Add message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID
    });

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      attempts++;

      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        console.error('Run failed:', runStatus);
        throw new Error(`Run failed with status: ${runStatus.status}`);
      }
    }

    if (runStatus.status !== 'completed') {
      throw new Error('Assistant took too long to respond');
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0]; // Most recent message
    
    // Extract text from the response
    let aiResponse = '';
    if (lastMessage.content[0].type === 'text') {
      aiResponse = lastMessage.content[0].text.value;
    }

    // Store in database
    await supabase
      .from('questions')
      .insert([{
        session_id: sessionId,
        question: message,
        answer: aiResponse,
        thread_id: threadId,
        created_at: new Date().toISOString()
      }]);

    // Update question count
    const newCount = (session?.question_count || 0) + 1;
    await supabase
      .from('sessions')
      .update({ 
        question_count: newCount,
        thread_id: threadId,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    return Response.json({ 
      response: aiResponse,
      questionCount: newCount,
      remainingQuestions: 999 // Unlimited for testing
    });

  } catch (error) {
    console.error('Chat error:', error);
    return Response.json({ 
      error: 'Failed to process chat message',
      details: error.message 
    }, { status: 500 });
  }
}
