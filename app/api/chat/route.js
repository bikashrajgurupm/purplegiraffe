//Deploy test

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
  // Normalize the response for checking
  const normalizedResponse = aiResponse.toLowerCase();
  
  // PRIORITY 1: Check for "I don't know" / "I can't find" / "Not in files" responses
  // These should NEVER count as real answers
  const noInfoPatterns = [
    /couldn't find|could not find|can't find|cannot find/i,
    /don't have (that |any |specific )?information/i,
    /no (specific |relevant |available )?(information|data|details)/i,
    /not (able to |able to find|sure|certain)/i,
    /don't know|do not know/i,
    /can't help with that|cannot help with that/i,
    /don't have access|do not have access/i,
    /unable to (find|locate|determine|identify)/i,
    /not mentioned|wasn't mentioned|was not mentioned/i,
    /didn't find|did not find/i,
    /no mention of/i,
    /files you uploaded/i,
    /in the files/i,
    /if you have any other questions/i,
    /feel free to (ask|let me know)/i,
    /is there anything else/i,
    /let me know if/i,
    /happy to help with/i,
    /need assistance with something else/i
  ];

  // If it contains ANY "no info" pattern, it's not a real answer
  for (const pattern of noInfoPatterns) {
    if (pattern.test(aiResponse)) {
      return false; // Definitely not a real answer
    }
  }

  // PRIORITY 2: Check for errors
  const errorPatterns = [
    /error|failed|sorry|apologize|couldn't|unable|problem occurred/i,
    /try again|something went wrong/i,
    /cannot process/i,
    /unavailable|not available/i
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(aiResponse)) {
      return false;
    }
  }

  // PRIORITY 3: Check for clarifying questions
  const clarifyingPatterns = [
    /to provide you with the best advice/i,
    /could you please provide/i,
    /can you (please )?(tell|share|provide|clarify|specify)/i,
    /I'd like to know/i,
    /I need to know/i,
    /few key details/i,
    /once you share this information/i,
    /need (more|additional|some) (information|details|context)/i,
    /before I can (help|provide|assist)/i,
    /would be helpful to know/i,
    /what (exactly|specifically|kind of|type of)/i,
    /which (network|platform|version|type)/i,
    /are you (using|seeing|experiencing)/i,
    /quick question/i,
    /let me know/i,
    /what's your/i
  ];

  for (const pattern of clarifyingPatterns) {
    if (pattern.test(aiResponse)) {
      return false;
    }
  }

  // PRIORITY 4: Check if it's primarily questions (numbered list of questions)
  const numberedQuestions = /\d+\.\s+[^\n]*\?/g;
  const numberedQuestionCount = (aiResponse.match(numberedQuestions) || []).length;
  if (numberedQuestionCount >= 2) {
    return false; // Multiple numbered questions = asking for info
  }

  // Count total question marks
  const questionMarks = (aiResponse.match(/\?/g) || []).length;
  if (questionMarks > 3) {
    return false; // Too many questions to be a real answer
  }

  // PRIORITY 5: Check length - very short responses aren't real answers
  if (aiResponse.length < 100) {
    return false;
  }

  // PRIORITY 6: Must contain actual monetization advice to count
  const monetizationTerms = [
    /eCPM|CPM|fill rate|revenue|monetization/i,
    /ad network|waterfall|mediation|impression/i,
    /interstitial|banner|rewarded|native/i,
    /AdMob|AppLovin|Unity|ironSource|Meta|Vungle/i,
    /policy|violation|optimization|performance/i,
    /\$\d+|€\d+|£\d+|₹\d+/,  // Money amounts
    /\d+%/  // Percentages
  ];

  let hasMonetizationContent = false;
  for (const pattern of monetizationTerms) {
    if (pattern.test(aiResponse)) {
      hasMonetizationContent = true;
      break;
    }
  }

  // PRIORITY 7: Check for actionable advice
  const actionablePatterns = [
    /you (should|can|need to|want to|could)/i,
    /first thing|start by|begin with/i,
    /here's what|this is what/i,
    /check your|look at|examine|review/i,
    /try (to|this|updating|changing)/i,
    /make sure|ensure that/i,
    /typically|usually|generally|often/i,
    /I've (found|seen)|in my experience/i,
    /the (best|recommended|optimal) (way|approach|method)/i
  ];

  let hasActionableAdvice = false;
  for (const pattern of actionablePatterns) {
    if (pattern.test(aiResponse)) {
      hasActionableAdvice = true;
      break;
    }
  }

  // Final decision: Only count if it has real content
  // Must have EITHER actionable advice OR monetization content with sufficient length
  if (hasActionableAdvice || (hasMonetizationContent && aiResponse.length > 200)) {
    return true;
  }

  // If it doesn't have monetization terms OR actionable advice, don't count it
  return false;
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
    
    // Don't count errors toward the limit
    const { data: session } = await supabase
      .from('sessions')
      .select('question_count')
      .eq('session_id', sessionId)
      .single();
    
    return Response.json({ 
      response: 'Sorry, I encountered an error. Please try again.',
      questionCount: session?.question_count || 0,
      remainingQuestions: user ? 999 : Math.max(0, QUESTION_LIMIT - (session?.question_count || 0)),
      isError: true
    }, { status: 500 });
  }
}
