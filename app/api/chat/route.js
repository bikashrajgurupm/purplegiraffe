// app/api/chat/route.js - COMPLETE FIXED VERSION

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const QUESTION_LIMIT = 10;

// Keep thread management for conversation history
async function getOrCreateThread(sessionId, userId = null) {
  const { data: session } = await supabase
    .from('sessions')
    .select('thread_id, conversation_history')
    .eq('session_id', sessionId)
    .single();
  
  if (session?.thread_id) {
    return {
      threadId: session.thread_id,
      history: session.conversation_history || []
    };
  }
  
  // Create new thread ID (just a unique ID now, not OpenAI thread)
  const threadId = `thread_${sessionId}_${Date.now()}`;
  
  await supabase
    .from('sessions')
    .update({ 
      thread_id: threadId,
      user_id: userId,
      conversation_history: [],
      updated_at: new Date().toISOString()
    })
    .eq('session_id', sessionId);
  
  return { threadId, history: [] };
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

// Generate embedding for the query
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 768
  });
  return response.data[0].embedding;
}

// Retrieve relevant context from your knowledge base
async function retrieveContext(query, topK = 7) {
  const embedding = await generateEmbedding(query);
  
  const { data: documents, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: topK
  });
  
  if (error) {
    console.error('Error retrieving documents:', error);
    return '';
  }
  
  // Format context from documents
  const contextParts = documents
    .filter(doc => doc.similarity > 0.3)
    .map(doc => `[${doc.document_name} - Relevance: ${(doc.similarity * 100).toFixed(1)}%]\n${doc.content}`)
    .join('\n---\n');
  
  return contextParts;
}

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();
    
    // Get user from auth header
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
          conversation_history: [],
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

    // Get current count from database
    const currentCount = session.question_count || 0;
    console.log('Current question count:', currentCount);

    // Check question limits for non-logged-in users
    if (!user && currentCount >= QUESTION_LIMIT) {
      return Response.json({ 
        error: 'Question limit reached. Please sign up to continue.',
        questionCount: currentCount,
        remainingQuestions: 0,
        limitReached: true
      }, { status: 403 });
    }

    // Get thread and conversation history
    const { threadId, history } = await getOrCreateThread(sessionId, user?.id);

    // Retrieve relevant context from knowledge base
    console.log('🔍 Searching knowledge base for:', message);
    const context = await retrieveContext(message);
    console.log(`📚 Found ${context ? 'relevant' : 'no'} context`);

    // Build messages for Groq
    const messages = [
      {
        role: "system",
        content: `You are an intelligent assistant with access to a specialized knowledge base about mobile app monetization, ad optimization, and eCPM improvement.

${context ? `## Relevant Knowledge Base Content:\n${context}\n\n` : ''}

## Instructions:
- Provide accurate, actionable answers based on the knowledge base content
- Be specific with numbers, percentages, and technical details when available
- If the knowledge base doesn't contain relevant information, provide general best practices
- Focus on practical, implementable solutions
- Keep responses conversational but professional

## FORMATTING RULES - CRITICAL:
- DO NOT use asterisks (*) for any purpose
- DO NOT use markdown formatting
- DO NOT use ** for bold or * for italics
- For bullet points, use simple dashes (-) or numbers (1. 2. 3.)
- Write in plain text only
- For emphasis, use CAPITALS or "quotes" instead of formatting

Example of correct formatting:
- First point (not * First point)
- Second point (not * Second point)
1. Numbered item (not **1.** Numbered item)`
      }
    ];

    // Add conversation history (last 3 exchanges)
    if (history && history.length > 0) {
      messages.push(...history.slice(-6));
    }

    // Add current message
    messages.push({ role: "user", content: message });

    // Generate response with Groq
    console.log('💭 Generating response with Llama 3.1...');
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: messages,
      temperature: 0.4,
      max_tokens: 2000,
      top_p: 0.9
    });

    let aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Clean up formatting
    aiResponse = aiResponse
      .replace(/^\* /gm, '• ')
      .replace(/^\- /gm, '• ')
      .replace(/^\*\*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/_([^_\n]+)_/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[\*_]{3,}$/gm, '')
      .replace(/^>\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Update question count for non-logged users
    let newCount = currentCount;
    let shouldCount = false;
    
    if (!user) {
      // Always count for non-logged users
      shouldCount = true;
      newCount = currentCount + 1;
      
      console.log('Incrementing count from', currentCount, 'to', newCount);
      
      // Update conversation history
      const updatedHistory = [
        ...(history || []),
        { role: "user", content: message },
        { role: "assistant", content: aiResponse }
      ].slice(-10);
      
      // Simple update without complex locking
      const { data: updatedSession, error: updateError } = await supabase
        .from('sessions')
        .update({ 
          question_count: newCount,
          thread_id: threadId,
          conversation_history: updatedHistory,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Failed to update session:', updateError);
        // Try to get the current count on error
        const { data: latestSession } = await supabase
          .from('sessions')
          .select('question_count')
          .eq('session_id', sessionId)
          .single();
        
        if (latestSession) {
          newCount = latestSession.question_count;
          console.log('Using fallback count:', newCount);
        }
      } else if (updatedSession) {
        newCount = updatedSession.question_count;
        console.log('Update successful, count is now:', newCount);
      }
    } else {
      // For logged users, just update conversation history
      const updatedHistory = [
        ...(history || []),
        { role: "user", content: message },
        { role: "assistant", content: aiResponse }
      ].slice(-10);
      
      await supabase
        .from('sessions')
        .update({ 
          thread_id: threadId,
          conversation_history: updatedHistory,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
    }

    // Store Q&A in database
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
    const remainingQuestions = user ? 999 : Math.max(0, QUESTION_LIMIT - newCount);

    // Update chat history for logged users
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

    console.log('Final count being returned:', newCount);

    return Response.json({ 
      response: aiResponse,
      questionCount: newCount,
      remainingQuestions,
      wasCountedAsQuestion: shouldCount,
      threadId: threadId
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    let sessionCount = 0;
    try {
      const body = await request.text();
      const parsed = JSON.parse(body);
      const { data: session } = await supabase
        .from('sessions')
        .select('question_count')
        .eq('session_id', parsed.sessionId)
        .single();
      sessionCount = session?.question_count || 0;
    } catch (e) {
      console.error('Could not get session count:', e);
    }
    
    return Response.json({ 
      response: 'Sorry, I encountered an error. Please try again.',
      questionCount: sessionCount,
      remainingQuestions: Math.max(0, QUESTION_LIMIT - sessionCount),
      isError: true
    }, { status: 500 });
  }
}
