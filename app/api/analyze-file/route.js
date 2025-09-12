// app/api/analyze-file/route.js - COMPLETE VERSION WITH OCR AND PDF

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

// Assess text quality for monetization data
function assessTextQuality(text) {
  if (!text || text.trim().length < 20) {
    return { quality: 'poor', reason: 'Too little text extracted' };
  }
  
  // Check for monetization keywords
  const keywords = ['ecpm', 'cpm', 'revenue', 'impression', 'fill', 'rate', 'ads', 'network', 
                    'admob', 'applovin', 'unity', 'click', 'ctr', '$', '%', 'monetization',
                    'earnings', 'payout', 'dashboard', 'performance'];
  const lowerText = text.toLowerCase();
  const keywordMatches = keywords.filter(kw => lowerText.includes(kw)).length;
  
  // Check for numbers (metrics usually have numbers)
  const numberMatches = text.match(/\d+\.?\d*/g) || [];
  
  // Check for gibberish (too many special characters or broken words)
  const gibberishRatio = (text.match(/[^\w\s\.\,\$\%\-\:]/g) || []).length / text.length;
  
  // Scoring
  if (keywordMatches >= 3 && numberMatches.length >= 2 && gibberishRatio < 0.2) {
    return { quality: 'good', reason: 'Clear monetization data detected' };
  } else if (keywordMatches >= 1 || numberMatches.length >= 1) {
    return { quality: 'partial', reason: 'Some data extracted but may be incomplete' };
  } else {
    return { quality: 'poor', reason: 'Unable to extract clear monetization data' };
  }
}

// Extract text from image using OCR
async function extractTextFromImage(base64Data) {
  try {
    console.log('Starting OCR processing...');
    
    // Clean base64 string
    let base64 = base64Data;
    if (base64.includes('base64,')) {
      base64 = base64.split('base64,')[1];
    }
    
    const imageBuffer = Buffer.from(base64, 'base64');
    console.log('Image buffer size:', imageBuffer.length);
    
    // Perform OCR
    const result = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: m => console.log('OCR Progress:', m.status, m.progress)
      }
    );
    
    const extractedText = result.data.text;
    console.log('OCR complete. Text length:', extractedText.length);
    
    const quality = assessTextQuality(extractedText);
    console.log('OCR Quality:', quality);
    
    return {
      success: true,
      text: extractedText || '',
      quality: quality.quality,
      reason: quality.reason
    };
    
  } catch (error) {
    console.error('OCR error:', error);
    return {
      success: false,
      text: '',
      quality: 'error',
      reason: 'OCR processing failed: ' + error.message
    };
  }
}

// Extract text from PDF
async function extractTextFromPDF(base64Data) {
  try {
    console.log('Starting PDF text extraction...');
    
    // Clean base64 string
    let base64 = base64Data;
    if (base64.includes('base64,')) {
      base64 = base64.split('base64,')[1];
    }
    
    const pdfBuffer = Buffer.from(base64, 'base64');
    console.log('PDF buffer size:', pdfBuffer.length);
    
    // Extract text from PDF
    const data = await pdf(pdfBuffer);
    
    console.log('PDF extraction complete:', {
      pages: data.numpages,
      textLength: data.text ? data.text.length : 0
    });
    
    // Check if we got any text
    if (!data.text || data.text.trim().length === 0) {
      return {
        success: false,
        text: '',
        quality: 'poor',
        reason: 'PDF appears to be empty or contains only images',
        pages: data.numpages
      };
    }
    
    // Limit text length for API limits
    let extractedText = data.text.trim();
    const maxLength = 4000;
    if (extractedText.length > maxLength) {
      extractedText = extractedText.substring(0, maxLength) + '\n...[Text truncated]';
    }
    
    const quality = assessTextQuality(extractedText);
    
    return {
      success: true,
      text: extractedText,
      quality: quality.quality,
      reason: quality.reason,
      pages: data.numpages
    };
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      success: false,
      text: '',
      quality: 'error',
      reason: 'PDF processing failed: ' + error.message
    };
  }
}

// Extract metrics from text
function extractMetrics(text) {
  if (!text) return {};
  
  const metrics = {};
  
  // Patterns for extracting specific metrics
  const patterns = {
    ecpm: /(?:ecpm|cpm)[:\s]*\$?([\d,]+\.?\d*)/gi,
    fillRate: /(?:fill\s*rate|fill)[:\s]*([\d]+\.?\d*)%?/gi,
    impressions: /(?:impressions?|imps?)[:\s]*([\d,]+)/gi,
    revenue: /(?:revenue|earnings?|income)[:\s]*\$?([\d,]+\.?\d*)/gi,
    ctr: /(?:ctr|click[\s-]*through[\s-]*rate)[:\s]*([\d]+\.?\d*)%?/gi,
    clicks: /(?:clicks?)[:\s]*([\d,]+)/gi
  };
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      metrics[key] = matches.map(m => m[1]);
    }
  }
  
  // Find ad network names
  const networks = [
    'AdMob', 'Google AdMob', 'AppLovin', 'MAX', 'Unity Ads', 'Unity',
    'IronSource', 'Vungle', 'Facebook', 'Meta', 'Audience Network',
    'Chartboost', 'InMobi', 'MoPub', 'Amazon', 'AdColony', 'Tapjoy',
    'Pangle', 'Mintegral', 'Fyber'
  ];
  
  const foundNetworks = [];
  networks.forEach(network => {
    if (new RegExp(network, 'gi').test(text)) {
      foundNetworks.push(network);
    }
  });
  
  if (foundNetworks.length > 0) {
    metrics.networks = [...new Set(foundNetworks)]; // Remove duplicates
  }
  
  return metrics;
}

// Generate helpful template for manual input
function generateManualInputTemplate() {
  return `I see you've uploaded a file for analysis. To provide the best optimization recommendations, please share the following metrics from your dashboard:

📊 **Key Metrics:**
• eCPM: (e.g., $2.45)
• Fill Rate: (e.g., 85%)
• Impressions: (e.g., 50,000)
• Revenue: (e.g., $125.50)
• CTR: (e.g., 1.2%)

🌐 **Ad Networks Performance:**
• Which networks are shown?
• Performance by network?

⚠️ **Issues or Concerns:**
• Any error messages?
• Significant drops in metrics?
• Low performing areas?

Once you provide these details, I can give you specific optimization strategies!`;
}

export async function POST(request) {
  try {
    const { file, sessionId, message } = await request.json();
    
    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = await getUserFromToken(token);
    
    if (!user) {
      return Response.json({ 
        error: 'Please log in to upload files',
        requiresAuth: true 
      }, { status: 401 });
    }
    
    if (!file || !file.data) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log('Processing file:', {
      name: file.name,
      type: file.type,
      dataLength: file.data ? file.data.length : 0
    });
    
    let extractionResult;
    let fileDescription = '';
    
    // Process based on file type
    if (file.type.startsWith('image/')) {
      fileDescription = 'screenshot';
      extractionResult = await extractTextFromImage(file.data);
    } else if (file.type === 'application/pdf') {
      fileDescription = 'PDF document';
      extractionResult = await extractTextFromPDF(file.data);
    } else {
      return Response.json({ 
        error: 'Unsupported file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF.' 
      }, { status: 400 });
    }
    
    // Extract metrics from OCR/PDF text
    let extractedMetrics = {};
    if (extractionResult.text) {
      extractedMetrics = extractMetrics(extractionResult.text);
    }
    
    // Also extract metrics from user's message if provided
    let userMetrics = {};
    if (message && message.length > 10) {
      userMetrics = extractMetrics(message);
    }
    
    // Combine all metrics
    const allMetrics = {
      ...extractedMetrics,
      ...userMetrics
    };
    
    // Build context for AI
    let contextForAI = '';
    let needsManualInput = false;
    
    if (!extractionResult.success || extractionResult.quality === 'poor') {
      // Extraction failed or quality is poor
      needsManualInput = true;
      
      if (Object.keys(allMetrics).length > 0) {
        // User provided some metrics in their message
        contextForAI = `The ${fileDescription} upload had issues (${extractionResult.reason}), but the user provided these metrics:
        
${Object.entries(allMetrics).map(([key, value]) => 
  `• ${key}: ${Array.isArray(value) ? value.join(', ') : value}`
).join('\n')}

Please analyze these metrics and provide optimization recommendations.`;
      } else {
        // No metrics available, ask for manual input
        contextForAI = generateManualInputTemplate();
      }
      
    } else if (extractionResult.quality === 'partial') {
      // Partial extraction - show what we found
      contextForAI = `Partial data extracted from ${fileDescription}:

Text extracted:
${extractionResult.text.substring(0, 1500)}${extractionResult.text.length > 1500 ? '...' : ''}

Detected metrics:
${Object.keys(allMetrics).length > 0 ? 
  Object.entries(allMetrics).map(([key, value]) => 
    `• ${key}: ${Array.isArray(value) ? value.join(', ') : value}`
  ).join('\n') : 
  '• No clear metrics detected'}

Note: The extraction was partial. If you see important metrics missing, please provide them manually.`;
      
    } else if (extractionResult.quality === 'good') {
      // Good extraction - full analysis
      contextForAI = `Successfully extracted data from ${fileDescription}:

${extractionResult.pages ? `Pages: ${extractionResult.pages}\n` : ''}
Extracted text:
${extractionResult.text.substring(0, 2000)}${extractionResult.text.length > 2000 ? '...' : ''}

Detected metrics:
${Object.keys(allMetrics).length > 0 ? 
  Object.entries(allMetrics).map(([key, value]) => 
    `• ${key}: ${Array.isArray(value) ? value.join(', ') : value}`
  ).join('\n') : 
  '• Reviewing full text for analysis...'}`;
    }
    
    // Prepare system prompt
    const systemPrompt = `You are an expert in mobile app monetization, ad networks, and revenue optimization.

${needsManualInput && Object.keys(allMetrics).length === 0 ? 
  'The user uploaded a file but extraction was unsuccessful. Guide them to share the specific metrics visible in their dashboard.' :
  'Analyze the provided data and give specific optimization recommendations.'}

Key optimization strategies to consider:
• Waterfall optimization for improved eCPM
• Fill rate improvements (target 80%+ for tier 1 geos)
• Network diversification to reduce dependency
• Ad placement and frequency optimization
• eCPM floors adjustment
• Geographic targeting optimization

Benchmarks to consider:
• eCPM < $1.50: Generally low, needs optimization
• Fill rate < 70%: Network or implementation issues
• CTR < 0.5%: Possible ad placement or relevance issues
• Single network > 60% of revenue: Over-dependency risk

FORMATTING RULES:
- Use simple dashes (-) for bullet points
- Write in plain text only
- Be specific with numbers and percentages
- Provide actionable recommendations`;
    
    // Create messages for Groq
    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `${message || `Please analyze this ${fileDescription}`}\n\n${contextForAI}`
      }
    ];
    
    console.log('Sending to Llama 3.1 for analysis...');
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: messages,
      temperature: 0.4,
      max_tokens: 2000,
      top_p: 0.9
    });
    
    let aiResponse = completion.choices[0]?.message?.content || 
      'I need more information to analyze your monetization data. Please provide the key metrics from your dashboard.';
    
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
    
    // Store in database
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
      extractionQuality: extractionResult.quality,
      metricsFound: Object.keys(allMetrics).length > 0,
      metrics: allMetrics
    });
    
  } catch (error) {
    console.error('File analysis error:', error);
    return Response.json({ 
      error: 'Failed to process the file. Please try again or describe the metrics you see.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
