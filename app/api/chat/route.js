import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are PurpleGiraffe, an expert AI monetization consultant specializing in mobile app monetization. You provide specific, actionable advice about:
- Ad monetization strategies (eCPM optimization, fill rates, waterfall setup)
- Ad networks (AppLovin MAX, Unity Ads, ironSource, AdMob, Meta Audience Network)
- Revenue optimization (specific percentages, benchmarks, and metrics)
- SDK integration issues and solutions
- Policy compliance and violation fixes

Always provide:
1. Specific numerical targets (e.g., "Aim for 95%+ fill rate")
2. Step-by-step actionable solutions
3. Industry benchmarks and expected outcomes
4. Common pitfalls to avoid

Keep responses concise but comprehensive. Focus on practical implementation.`;

// Configuration - Add your email here for unlimited access
const ADMIN_EMAILS = [
  'bikashrajguru@gmail.com',  // Replace with your actual email
  // Add more admin emails here if needed
];

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();

    if (!message || !sessionId) {
      return Response.json({ error: 'Message and sessionId required' }, { status: 400 });
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError) throw sessionError;

   
    // Check free tier limits (skip for admin emails)
// const isAdmin = session?.email && ADMIN_EMAILS.includes(session.email.toLowerCase());

// if (!isAdmin && !session?.email_captured && session.question_count >= 3) {
//   return Response.json({ 
//     error: 'Free tier limit reached', 
//     requiresEmail: true 
//   }, { status: 403 });
// }

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const aiResponse = completion.choices[0].message.content;

    // Store question in database
    await supabase
      .from('questions')
      .insert([{
        session_id: sessionId,
        question: message,
        answer: aiResponse,
        created_at: new Date().toISOString()
      }]);

    // Update question count
    const newCount = (session.question_count || 0) + 1;
    await supabase
      .from('sessions')
      .update({ 
        question_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    return Response.json({ 
      response: aiResponse,
      questionCount: newCount,
      remainingQuestions: Math.max(0, 3 - newCount)
    });

  } catch (error) {
    console.error('Chat error:', error);
    return Response.json({ error: 'Failed to process chat message' }, { status: 500 });
  }
}
