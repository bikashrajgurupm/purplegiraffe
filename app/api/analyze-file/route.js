// app/api/analyze-file/route.js

import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

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

// Extract text from base64 image using OCR (you'll need to implement this)
// For now, we'll provide a structured analysis based on common patterns
async function extractTextFromImage(base64Data) {
  // Remove data URL prefix
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  
  // In a real implementation, you would:
  // 1. Use an OCR service like Google Cloud Vision, AWS Textract, or Tesseract.js
  // 2. Extract text and structured data from the image
  // 3. Return the extracted text
  
  // For now, return a prompt to analyze based on common metrics
  return `Please analyze this screenshot of an ad monetization dashboard. Common metrics to look for include:
  - eCPM (effective cost per mille)
  - Fill Rate
  - Impressions
  - Revenue
  - CTR (Click-through rate)
  - Ad Network performance (AdMob, AppLovin, Unity Ads, etc.)
  The user is asking for help optimizing their monetization.`;
}

// Extract text from PDF
async function extractTextFromPDF(base64Data) {
  // Remove data URL prefix
  const base64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
  
  // In a real implementation, you would:
  // 1. Use a PDF parsing library like pdf-parse or pdfjs-dist
  // 2. Extract text content from the PDF
  // 3. Return the extracted text
  
  // For now, return a generic prompt
  return `Please analyze this PDF document about app monetization. Look for key metrics, performance indicators, and optimization opportunities.`;
}

export async function POST(request) {
  try {
    const { file, sessionId, message } = await request.json();
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = await getUserFromToken(token);
    
    // Only logged-in users can upload files
    if (!user) {
      return Response.json({ 
        error: 'Please log in to upload files',
        requiresAuth: true 
      }, { status: 401 });
    }
    
    if (!file || !file.data) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Extract text based on file type
    let extractedContent = '';
    let fileDescription = '';
    
    if (file.type.startsWith('image/')) {
      extractedContent = await extractTextFromImage(file.data);
      fileDescription = 'screenshot';
    } else if (file.type === 'application/pdf') {
      extractedContent = await extractTextFromPDF(file.data);
      fileDescription = 'PDF document';
    } else {
      return Response.json({ error: 'Unsupported file type' }, { status: 400 });
    }
    
    // Prepare context for Groq
    const systemPrompt = `You are an expert in mobile app monetization, ad networks, and revenue optimization. 
    The user has uploaded a ${fileDescription} related to their app's monetization performance.
    
    Based on the provided context, analyze the data and provide:
    1. Key observations about the metrics
    2. Potential issues or areas of concern
    3. Specific, actionable recommendations for improvement
    4. Best practices relevant to their situation
    
    Focus on metrics like eCPM, fill rate, impressions, revenue, CTR, and network performance.
    Be specific with your recommendations and explain the reasoning.
    
    FORMATTING RULES:
    - Use simple dashes (-) for bullet points
    - Write in plain text only
    - Be conversational but professional`;
    
    // Create messages for Groq
    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `${message || 'Please analyze this ' + fileDescription}\n\nContext from the file:\n${extractedContent}`
      }
    ];
    
    // Generate response with Groq
    console.log('Analyzing file with Llama 3.1...');
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: messages,
      temperature: 0.4,
      max_tokens: 2000,
      top_p: 0.9
    });
    
    let aiResponse = completion.choices[0]?.message?.content || 'I can analyze your file, but I need more context. Could you tell me what specific metrics or issues you\'d like me to focus on?';
    
    // Clean up formatting
    aiResponse = aiResponse
      .replace(/^\* /gm, '• ')
      .replace(/^\- /gm, '• ')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/_([^_\n]+)_/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .trim();
    
    // Store the analysis in the database
    if (sessionId) {
      await supabase
        .from('questions')
        .insert([{
          session_id: sessionId,
          user_id: user.id,
          question: `[File Upload: ${file.name}] ${message || 'Analyze this file'}`,
          answer: aiResponse,
          thread_id: `file_${Date.now()}`,
          created_at: new Date().toISOString()
        }]);
    }
    
    return Response.json({ 
      response: aiResponse,
      fileProcessed: true
    });
    
  } catch (error) {
    console.error('File analysis error:', error);
    return Response.json({ 
      error: 'Failed to analyze the file. Please try describing what you see in the image instead.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
