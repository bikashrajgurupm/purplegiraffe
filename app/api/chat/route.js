//Deploy test - Fixed version

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

// Helper function to determine if response is a real answer
function isRealAnswer(aiResponse) {
  console.log('=== CHECKING IF REAL ANSWER ===');
  console.log('Response preview:', aiResponse.substring(0, 150));
  
  // Convert to lowercase for easier checking
  const lowerResponse = aiResponse.toLowerCase();
  
  // BLOCK LIST - These phrases mean it's NOT a real answer
  const blockPhrases = [
    "couldn't find",
    "could not find",
    "can't find",
    "cannot find",
    "didn't find",
    "did not find",
    "unable to find",
    "unable to locate",
    "don't have that information",
    "don't have access",
    "no specific mention",
    "not mentioned",
    "files you uploaded",
    "in the files",
    "in your files",
    "if you have any other questions",
    "anything else",
    "something else",
    "need assistance with",
    "happy to help with",
    "let me know if",
    "feel free to ask"
  ];
  
  // Check if response contains any block phrases
  for (const phrase of blockPhrases) {
    if (lowerResponse.includes(phrase)) {
      console.log(`BLOCKED: Contains "${phrase}" - NOT counting as answer`);
      return false;
    }
  }
  
  // Check for error messages
  if (lowerResponse.includes("error") || 
      lowerResponse.includes("sorry") ||
      lowerResponse.includes("apologize") ||
      lowerResponse.includes("unable") ||
      lowerResponse.includes("cannot") ||
      lowerResponse.includes("can't")) {
    console.log('BLOCKED: Error/apology message - NOT counting');
    return false;
  }
  
  // Check for clarifying questions
  const clarifyingPhrases = [
    "can you tell",
    "can you share",
    "can you provide",
    "could you please",
    "could you tell",
    "could you share",
    "i'd like to know",
    "i need to know",
    "to provide you with",
    "to give you the best",
    "what exactly",
    "what specifically",
    "which network",
    "which platform",
    "are you using",
    "are you seeing",
    "do you have"
  ];
  
  for (const phrase of clarifyingPhrases) {
    if (lowerResponse.includes(phrase)) {
      console.log(`BLOCKED: Clarifying question "${phrase}" - NOT counting`);
      return false;
    }
  }
  
  // Check if too short
  if (aiResponse.length < 100) {
    console.log('BLOCKED: Too short (under 100 chars) - NOT counting');
    return false;
  }
  
  // Count question marks
  const questionMarks = (aiResponse.match(/\?/g) || []).length;
  console.log('Question marks found:', questionMarks);
  
  // Too many questions = clarifying
  if (questionMarks > 3) {
    console.log('BLOCKED: Too many questions - NOT counting');
    return false;
  }
  
  // Check for numbered questions (1. Question? 2. Question?)
  const numberedQuestions = aiResponse.match(/\d+\.\s+[^\n]*\?/g) || [];
  if (numberedQuestions.length >= 2) {
    console.log('BLOCKED: Multiple numbered questions - NOT counting');
    return false;
  }
  
  // POSITIVE CHECK - Must have valuable content to count
  const hasMonetizationContent = 
    /eCPM|CPM|fill rate|revenue|monetization/i.test(aiResponse) ||
    /ad network|waterfall|mediation|impression/i.test(aiResponse) ||
    /interstitial|banner|rewarded|native/i.test(aiResponse) ||
    /AdMob|AppLovin|Unity|ironSource/i.test(aiResponse) ||
    /policy|violation|optimization/i.test(aiResponse);
  
  const hasActionableAdvice = 
    /you should|you can|you need|you could/i.test(aiResponse) ||
    /first thing|start by|begin with/i.test(aiResponse) ||
    /check your|look at|examine|review/i.test(aiResponse) ||
    /try to|try this|try updating/i.test(aiResponse) ||
    /make sure|ensure that/i.test(aiResponse) ||
    /typically|usually|generally|often/i.test(aiResponse);
  
  console.log('Has monetization content:', hasMonetizationContent);
  console.log('Has actionable advice:', hasActionableAdvice);
  
  // Must have SOME value to count
  if (!hasMonetizationContent && !hasActionableAdvice) {
    console.log('BLOCKED: No valuable content found - NOT counting');
    return false;
  }
  
  // If we got here, it's a real answer
  console.log('APPROVED: Real answer with value - COUNTING');
  return true;
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

    // Check question limits for non-logged-in users BEFORE processing
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
        // Don't count failed responses
        return Response.json({ 
          response: 'Sorry, I encountered an error processing your request. Please try again.',
          questionCount: session.question_count, // Don't increment
          remainingQuestions: user ? 999 : Math.max(0, QUESTION_LIMIT - session.question_count),
          isError: true
        });
      }
      
      if (runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        // Don't count cancelled/expired responses
        return Response.json({ 
          response: 'The request timed out. Please try again.',
          questionCount: session.question_count, // Don't increment
          remainingQuestions: user ? 999 : Math.max(0, QUESTION_LIMIT - session.question_count),
          isError: true
        });
      }
    }

    if (runStatus.status !== 'completed') {
      // Don't count timeout responses
      return Response.json({ 
        response: 'The assistant took too long to respond. Please try again.',
        questionCount: session.question_count, // Don't increment
        remainingQuestions: user ? 999 : Math.max(0, QUESTION_LIMIT - session.question_count),
        isError: true
      });
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0];
    
    // Extract text from the response and CLEAN MARKDOWN
    let aiResponse = '';
    if (lastMessage.content[0].type === 'text') {
      aiResponse = lastMessage.content[0].text.value;
      
      // Strip all markdown formatting
      aiResponse = aiResponse
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^[\-\*_]{3,}$/gm, '')
        .replace(/^>\s+/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // Determine if this is a real answer that should count
    const shouldCount = !user && isRealAnswer(aiResponse); // Only count for non-logged users
    
    console.log('Final decision - should count?', shouldCount);
    
    // Only increment question count if it's a real answer
    let newCount = session.question_count;
    if (shouldCount) {
      newCount = session.question_count + 1;
      
      // Update question count in database
      await supabase
        .from('sessions')
        .update({ 
          question_count: newCount,
          thread_id: threadId,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
    }

    // Store question and answer in database (always store, even if not counting)
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

    // Calculate remaining questions
    let remainingQuestions = user ? 999 : Math.max(0, QUESTION_LIMIT - newCount);

    // Update chat history for logged-in users
    if (user) {
      const { data: chatHistory } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (chatHistory) {
        await supabase
          .from('chat_history')
          .update({
            last_message: message,
            message_count: chatHistory.message_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', chatHistory.id);
      } else {
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
      wasCountedAsQuestion: shouldCount,
      threadId: threadId
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    // Try to get session for proper count
    let sessionCount = 0;
    try {
      const { data: session } = await supabase
        .from('sessions')
        .select('question_count')
        .eq('session_id', sessionId)
        .single();
      sessionCount = session?.question_count || 0;
    } catch (e) {
      console.error('Could not get session count:', e);
    }
    
    return Response.json({ 
      response: 'Sorry, I encountered an error. Please try again.',
      questionCount: sessionCount,
      remainingQuestions: user ? 999 : Math.max(0, QUESTION_LIMIT - sessionCount),
      isError: true
    }, { status: 500 });
  }
}
