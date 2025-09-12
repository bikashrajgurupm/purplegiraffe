// app/api/analyze-file/route.js - WITH OCR IMPLEMENTATION

import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import jwt from 'jsonwebtoken';
import Tesseract from 'tesseract.js';
import pdf from 'pdf-parse';

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

// Extract text from base64 image using Tesseract.js
async function extractTextFromImage(base64Data) {
  try {
    console.log('Starting OCR processing...');
    
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64, 'base64');
    
    // Use Tesseract.js for OCR
    const result = await Tesseract.recognize(
      imageBuffer,
      'eng', // English language
      {
        logger: m => console.log('OCR Progress:', m.status, m.progress)
      }
    );
    
    const extractedText = result.data.text;
    console.log('OCR completed. Extracted text length:', extractedText.length);
    
    // If no text was extracted, provide a fallback
    if (!extractedText || extractedText.trim().length < 10) {
      return `Unable to extract clear text from the image. The image appears to show an app monetization dashboard. Please describe what specific metrics or issues you'd like me to analyze, such as:
      - eCPM values
      - Fill rates
      - Ad network performance
      - Revenue trends
      - Impression counts`;
    }
    
    // Clean up and format the extracted text
    const cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .trim();
    
    return `Extracted text from screenshot:\n${cleanedText}`;
    
  } catch (error) {
    console.error('OCR error:', error);
    return `OCR processing failed. Please describe the content of your screenshot, including:
    - What ad networks are shown
    - Key metrics like eCPM, fill rate, impressions
    - Any error messages or issues visible`;
  }
}

// Extract text from PDF
async function extractTextFromPDF(base64Data) {
  try {
    console.log('Starting PDF text extraction...');
    
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(base64, 'base64');
    
    // Extract text from PDF
    const data = await pdf(pdfBuffer);
    
    console.log('PDF info:', {
      pages: data.numpages,
      textLength: data.text.length
    });
    
    // If no text was extracted
    if (!data.text || data.text.trim().length < 10) {
      return `Unable to extract text from the PDF. The document appears to be either image-based or empty. Please provide the key information from the document such as:
      - Monetization metrics
      - Performance reports
      - Ad network data
      - Revenue information`;
    }
    
    // Limit text length to avoid token limits
    const maxLength = 3000;
    let extractedText = data.text.trim();
    
    if (extractedText.length > maxLength) {
      extractedText = extractedText.substring(0, maxLength) + '...\n[Text truncated due to length]';
    }
    
    return `Extracted text from PDF (${data.numpages} pages):\n${extractedText}`;
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return `PDF processing failed. Please describe the key content from your document, including any monetization metrics, performance data, or issues you need help with.`;
  }
}

// Analyze extracted content for monetization insights
function analyzeMonetizationContent(text) {
  const insights = {
    metrics: [],
    networks: [],
    issues: [],
    opportunities: []
  };
  
  // Look for common metrics
  const metricPatterns = {
    eCPM: /ecpm[:\s]+\$?([\d.]+)/gi,
    fillRate: /fill\s*rate[:\s]+([\d.]+)%?/gi,
    impressions: /impressions?[:\s]+([\d,]+)/gi,
    revenue: /revenue[:\s]+\$?([\d,.]+)/gi,
    CTR: /ctr[:\s]+([\d.]+)%?/gi,
    clicks: /clicks?[:\s]+([\d,]+)/gi
  };
  
  for (const [metric, pattern] of Object.entries(metricPatterns)) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      insights.metrics.push({
        type: metric,
        value: match[1]
      });
    }
  }
  
  // Look for ad network names
  const networks = ['AdMob', 'AppLovin', 'Unity Ads', 'IronSource', 'Vungle', 'Facebook', 'Meta', 'Chartboost', 'InMobi', 'MoPub'];
  networks.forEach(network => {
    if (text.toLowerCase().includes(network.toLowerCase())) {
      insights.networks.push(network);
    }
  });
  
  // Look for common issues
  const issueKeywords = ['drop', 'decrease', 'low', 'error', 'fail', 'issue', 'problem', 'crash', 'blank', 'not showing', 'zero'];
  issueKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      const context = text.toLowerCase().indexOf(keyword);
      const snippet = text.substring(Math.max(0, context - 30), Math.min(text.length, context + 30));
      if (snippet.length > 10) {
        insights.issues.push(snippet.trim());
      }
    }
  });
  
  return insights;
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
    let insights = null;
    
    if (file.type.startsWith('image/')) {
      extractedContent = await extractTextFromImage(file.data);
      fileDescription = 'screenshot';
    } else if (file.type === 'application/pdf') {
      extractedContent = await extractTextFromPDF(file.data);
      fileDescription = 'PDF document';
    } else {
      return Response.json({ error: 'Unsupported file type' }, { status: 400 });
    }
    
    // Analyze the extracted content for monetization insights
    insights = analyzeMonetizationContent(extractedContent);
    
    // Build context for AI
    let contextSummary = `\nFile Analysis Summary:\n`;
    
    if (insights.metrics.length > 0) {
      contextSummary += `\nDetected Metrics:\n`;
      insights.metrics.forEach(m => {
        contextSummary += `- ${m.type}: ${m.value}\n`;
      });
    }
    
    if (insights.networks.length > 0) {
      contextSummary += `\nAd Networks Found: ${insights.networks.join(', ')}\n`;
    }
    
    if (insights.issues.length > 0) {
      contextSummary += `\nPotential Issues Detected:\n`;
      insights.issues.slice(0, 3).forEach(issue => {
        contextSummary += `- ${issue}\n`;
      });
    }
    
    // Prepare prompt for Groq
    const systemPrompt = `You are an expert in mobile app monetization, ad networks, and revenue optimization. 
    The user has uploaded a ${fileDescription} related to their app's monetization performance.
    
    Based on the extracted text and analysis, provide:
    1. Key observations about the metrics (be specific with numbers if available)
    2. Potential issues or areas of concern
    3. Specific, actionable recommendations for improvement
    4. Best practices relevant to their situation
    
    Focus on metrics like eCPM, fill rate, impressions, revenue, CTR, and network performance.
    Be specific with your recommendations and explain the reasoning.
    
    FORMATTING RULES:
    - Use simple dashes (-) for bullet points
    - Write in plain text only
    - Be conversational but professional
    - If the extracted text is unclear, ask the user for specific clarification`;
    
    // Create messages for Groq
    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `${message || 'Please analyze this ' + fileDescription}\n\n${extractedContent}${contextSummary}`
      }
    ];
    
    // Generate response with Groq
    console.log('Analyzing with Llama 3.1...');
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
    
    // Add a note about OCR accuracy if relevant
    if (file.type.startsWith('image/') && extractedContent.includes('Unable to extract clear text')) {
      aiResponse = `Note: The text extraction from your image had limited success. For better analysis, please ensure the screenshot is clear and text is readable.\n\n${aiResponse}`;
    }
    
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
      fileProcessed: true,
      extractedMetrics: insights?.metrics || [],
      detectedNetworks: insights?.networks || []
    });
    
  } catch (error) {
    console.error('File analysis error:', error);
    return Response.json({ 
      error: 'Failed to analyze the file. Please try describing what you see in the image instead.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
