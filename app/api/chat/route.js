// app/api/chat/route.js - LLAMA 3.1 VERSION

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const QUESTION_LIMIT = 10;

// Ollama configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:latest';

// System prompt for Purple Giraffe
const SYSTEM_PROMPT = `You are Purple Giraffe, an expert AI assistant specializing in mobile app monetization, ad networks, and revenue optimization. You have deep knowledge of:

- Ad Networks: AppLovin, Unity Ads, AdMob, IronSource, Meta Audience Network, Vungle, etc.
- Monetization Metrics: eCPM, fill rate, ARPDAU, LTV, retention, CTR, conversion rates
- Ad Formats: Banner, interstitial, rewarded video, native ads, offerwall
- Optimization Strategies: Waterfall optimization, header bidding, ad placement, refresh rates
- Technical Issues: SDK integration, mediation setup, debugging ad serving issues
- Platform Specifics: iOS (IDFA, ATT), Android (GAID), privacy regulations

When answering:
1. Be specific and actionable
2. Provide data-driven insights when possible
3. Consider the user's app type and audience
4. Suggest A/B testing approaches
5. Address both technical and strategic aspects`;

async function getConversationHistory(sessionId) {
  const { data: messages } = await supabase
    .from('questions')
    .select('question, answer')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  return messages ? messages.reverse() : [];
}

async function callOllama(message, sessionId) {
  const history = await getConversationHistory(sessionId);
  
  let prompt = SYSTEM_PROMPT + "\n\n";
  
  if (history.length > 0) {
    prompt += "Previous conversation:\n";
    history.forEach(h => {
      prompt += `User: ${h.question}\nAssistant: ${h.answer}\n\n`;
    });
  }
  
  prompt += `User: ${message}\nAssistant:`;
  
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 2048
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  return data.response;
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

function isRealAnswer(aiResponse) {
  console.log('=== CHECKING IF REAL ANSWER ===');
  console.log('Response length:', aiResponse.length);
  
  const lowerResponse = aiResponse.toLowerCase();
  
  // Simplified checking for Llama responses
  const nonAnswerPhrases = [
    "i don't know",
    "i'm not sure",
    "i cannot provide",
    "could you provide more",
    "can you tell me more",
    "what type of app",
    "need more information"
  ];
  
  for (const phrase of nonAnswerPhrases) {
    if (lowerResponse.includes(phrase) && aiResponse.length < 200) {
      console.log(`BLOCKED: Contains "${phrase}" - NOT counting`);
      return false;
    }
  }
  
  // Check if response has substance
  const hasSubstance = 
    aiResponse.length > 150 ||
    /\d+\.\s+/.test(aiResponse) ||
    /\d+%/.test(aiResponse) ||
    /\$[\d,]+/.test(aiResponse);
  
  console.log('Has substance?', hasSubstance);
  return hasSubstance;
}

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();
    
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
      
      if (user && !session.user_id) {
        await supabase
          .from('sessions')
          .update({ user_id: user.id })
          .eq('session_id', sessionId);
      }
    }

    // Check question limits
    if (!user && session.question_count >= QUESTION_LIMIT) {
      return Response.json({ 
        error: 'Question limit reached. Please sign up to continue.',
        questionCount: session.question_count,
        remainingQuestions: 0,
        limitReached: true
      }, { status: 403 });
    }

    // Call Ollama to get response
    let aiResponse;
    try {
      aiResponse = await callOllama(message, sessionId);
    } catch (error) {
      console.error('Failed to get Ollama response:', error);
      aiResponse = 'Sorry, I encountered an error processing your request. Please try again.';
    }

    // Clean markdown from response
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

    // Check if response should count as a question
    const shouldCount = !user && isRealAnswer(aiResponse);
    
    console.log('Final decision - should count?', shouldCount);
    
    let newCount = session.question_count;
    if (shouldCount) {
      newCount = session.question_count + 1;
      
      await supabase
        .from('sessions')
        .update({ 
          question_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
    }

    // Store question and answer
    await supabase
      .from('questions')
      .insert([{
        session_id: sessionId,
        user_id: user?.id || null,
        question: message,
        answer: aiResponse,
        created_at: new Date().toISOString()
      }]);

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
      wasCountedAsQuestion: shouldCount
    });

  } catch (error) {
    console.error('Chat error:', error);
    
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
