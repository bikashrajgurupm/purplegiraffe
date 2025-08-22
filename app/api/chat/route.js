// app/api/chat/route.js - FINAL VERSION

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
  console.log('Response length:', aiResponse.length);
  console.log('First 200 chars:', aiResponse.substring(0, 200));
  
  // Convert to lowercase for checking
  const lowerResponse = aiResponse.toLowerCase();
  
  // PRIORITY 1: Definitely NOT real answers - "I don't know" patterns
  const definitelyNotAnswers = [
    "couldn't find",
    "could not find",
    "can't find",
    "cannot find",
    "didn't find",
    "unable to find",
    "no specific mention",
    "not mentioned",
    "files you uploaded",
    "in the files",
    "don't have that information",
    "don't have access",
    "i need more information",
    "i need to know",
    "need more details",
    "need additional information"
  ];
  
  for (const phrase of definitelyNotAnswers) {
    if (lowerResponse.includes(phrase)) {
      console.log(`BLOCKED: Contains "${phrase}" - NOT counting`);
      return false;
    }
  }
  
  // PRIORITY 2: Check for substantial content indicators
  const substantialContentIndicators = {
    numberedLists: /\b\d+\.\s+\w+/g,
    percentages: /\d+%/g,
    dollarAmounts: /\$[\d,]+/g,
    technicalTerms: /(ecpm|cpm|ctr|fill rate|ad placement|mediation|waterfall|refresh rate|banner size|interstitial|rewarded|native ad|impression|click-through|conversion|arpu|dau|mau|retention|ltv|roi|sdk|api|monetization|revenue|optimization)/gi,
    actionPhrases: /(optimize|implement|configure|adjust|increase|decrease|improve|test|experiment|explore|ensure|consider|place|incorporate|balance|maximize|minimize|enhance|boost|reduce)/gi,
    specificAdvice: /(you should|you can|you need to|make sure|try to|consider using|recommended to|best practice|typically|usually|generally|often|commonly)/gi
  };
  
  // Count substantial content
  let contentScore = 0;
  let detailedContent = {};
  
  for (const [type, pattern] of Object.entries(substantialContentIndicators)) {
    const matches = aiResponse.match(pattern) || [];
    detailedContent[type] = matches.length;
    
    // Weight different types of content
    if (type === 'numberedLists' && matches.length >= 2) contentScore += 3; // Multiple numbered points
    if (type === 'technicalTerms' && matches.length >= 3) contentScore += 2;
    if (type === 'actionPhrases' && matches.length >= 3) contentScore += 2;
    if (type === 'specificAdvice' && matches.length >= 2) contentScore += 2;
    if (type === 'percentages' && matches.length >= 1) contentScore += 1;
    if (type === 'dollarAmounts' && matches.length >= 1) contentScore += 1;
  }
  
  console.log('Content analysis:', detailedContent);
  console.log('Content score:', contentScore);
  
  // PRIORITY 3: If high content score, it's valuable regardless of ending
  if (contentScore >= 5) {
    console.log('APPROVED: High content score - substantial value provided - COUNTING');
    return true;
  }
  
  // PRIORITY 4: Check if response is PRIMARILY asking for information
  const sentences = aiResponse.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const totalSentences = sentences.length;
  
  // Questions that indicate gathering information
  const infoGatheringQuestions = [
    /what\s+(type|kind|version|platform|framework)/i,
    /which\s+(ad|network|sdk|platform|version)/i,
    /are\s+you\s+(using|seeing|experiencing|getting)/i,
    /do\s+you\s+(have|use|see|get)/i,
    /can\s+you\s+(share|tell|provide|explain)/i,
    /could\s+you\s+(share|tell|provide|clarify)/i,
    /how\s+(many|much|often|long)\s+(?:are|do|have)\s+you/i
  ];
  
  let questionSentences = 0;
  for (const sentence of sentences) {
    for (const pattern of infoGatheringQuestions) {
      if (pattern.test(sentence)) {
        questionSentences++;
        break;
      }
    }
  }
  
  const questionRatio = totalSentences > 0 ? questionSentences / totalSentences : 0;
  console.log(`Question ratio: ${questionSentences}/${totalSentences} = ${questionRatio.toFixed(2)}`);
  
  // If more than 50% is questions, it's information gathering
  if (questionRatio > 0.5) {
    console.log('BLOCKED: Majority of response is questions - NOT counting');
    return false;
  }
  
  // PRIORITY 5: Handle "let me know" contextually
  // Only block if "let me know" appears WITHOUT substantial content
  const hasLetMeKnow = lowerResponse.includes("let me know") || 
                       lowerResponse.includes("let us know") ||
                       lowerResponse.includes("feel free to ask");
  
  if (hasLetMeKnow) {
    // Check if it's just at the end as a courtesy
    const lastSentenceIndex = aiResponse.lastIndexOf('.');
    const contentBeforeLastSentence = lastSentenceIndex > 0 ? 
      aiResponse.substring(0, lastSentenceIndex) : aiResponse;
    
    // If there's substantial content before "let me know", count it
    if (contentBeforeLastSentence.length > 300 && contentScore >= 3) {
      console.log('APPROVED: "Let me know" is just courtesy ending after substantial content - COUNTING');
      return true;
    }
    
    // If "let me know" appears with minimal content, don't count
    if (contentScore < 2) {
      console.log('BLOCKED: "Let me know" with minimal content - NOT counting');
      return false;
    }
  }
  
  // PRIORITY 6: Check for structured content (lists, steps, multiple points)
  const hasNumberedList = detailedContent.numberedLists >= 3; // At least 3 numbered points
  const hasBulletStructure = (aiResponse.match(/\n\s*[-•]\s+/g) || []).length >= 3;
  
  if ((hasNumberedList || hasBulletStructure) && aiResponse.length > 300) {
    console.log('APPROVED: Structured list with multiple points - COUNTING');
    return true;
  }
  
  // PRIORITY 7: Length combined with moderate content
  if (aiResponse.length > 500 && contentScore >= 3) {
    console.log('APPROVED: Long response with moderate content score - COUNTING');
    return true;
  }
  
  if (aiResponse.length > 800 && contentScore >= 2) {
    console.log('APPROVED: Very long response with some content - COUNTING');
    return true;
  }
  
  // PRIORITY 8: Short responses need high value
  if (aiResponse.length < 150) {
    if (contentScore < 3) {
      console.log('BLOCKED: Short response without high value content - NOT counting');
      return false;
    }
  }
  
  // PRIORITY 9: Error messages
  if (lowerResponse.includes("error") && lowerResponse.includes("try again")) {
    console.log('BLOCKED: Error message - NOT counting');
    return false;
  }
  
  // PRIORITY 10: Pure introductory responses
  const introOnlyPhrases = [
    /^(hi|hello|hey|sure|absolutely|of course|i'd be happy|i can help)/i,
    /^let's (dive|explore|discuss|talk)/i
  ];
  
  const firstSentence = sentences[0] || '';
  let isIntroOnly = false;
  
  for (const pattern of introOnlyPhrases) {
    if (pattern.test(firstSentence) && contentScore < 2 && aiResponse.length < 300) {
      isIntroOnly = true;
      break;
    }
  }
  
  if (isIntroOnly) {
    console.log('BLOCKED: Introductory response without substance - NOT counting');
    return false;
  }
  
  // FINAL EVALUATION
  // Be more lenient - if it has decent length and some value, count it
  if (aiResponse.length > 250 && contentScore >= 2) {
    console.log('APPROVED: Decent length with some valuable content - COUNTING');
    return true;
  }
  
  // Default: Only block if we're sure it's not valuable
  console.log(`DEFAULT: Insufficient value (score: ${contentScore}, length: ${aiResponse.length}) - NOT counting`);
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
