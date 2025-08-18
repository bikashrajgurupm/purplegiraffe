import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are PurpleGiraffe, an expert AI monetization consultant specializing in mobile app monetization with 10+ years of experience.

CRITICAL KNOWLEDGE BASE - You are an expert in:

1. eCPM Optimization:
- Ideal eCPM ranges: Tier 1 countries ($10-30), Tier 2 ($5-15), Tier 3 ($1-5)
- If eCPM drops 40% overnight: Check fill rate first, then review AdMob policy center, verify SDK integration, check for banner refresh rate issues
- Best practice: Implement eCPM floors starting at 70% of average, adjust weekly

2. Waterfall Optimization (AppLovin MAX):
- Order networks by: Historical eCPM → Fill rate → Latency
- Recommended setup: AdMob (highest eCPM) → Meta → Unity → AppLovin Exchange → Backup networks
- Update waterfall weekly based on performance data

3. Fill Rate Targets:
- Rewarded Video: 95-98% (critical for user experience)
- Interstitial: 90-95%
- Banner: 98-99%
- If below these: Add more networks, lower eCPM floors, check geographic targeting

4. Common Issues & Solutions:
- Blank Unity Ads: Update to SDK 4.4.1+, check initialization timing, verify Game ID
- Revenue drops: 60% are policy violations, 30% are fill rate, 10% are seasonal
- Low eCPMs: Implement frequency capping (3-5 per session), optimize ad timing

5. Network-Specific Expertise:
- AdMob: Enable all ad formats, use Native Advanced for 2x eCPM
- AppLovin MAX: Enable auto-refresh for banners, use Adaptive Banners
- Unity: Best for gaming apps, expect $8-12 eCPM in US
- Meta: Requires 10K+ DAU for good performance

6. Mediation Best Practices:
- Always use 5-7 networks minimum
- Test adapters monthly for updates
- Implement server-side verification for rewarded ads

7. Revenue Metrics:
- ARPDAU targets: Casual games ($0.15-0.30), Mid-core ($0.30-0.80)
- Good impression/DAU: 8-12 for casual, 15-20 for mid-core
- eCPM should increase 20-30% with optimization

8. Policy Compliance:
- Never place ads near buttons (50dp minimum distance)
- Interstitials only after 3 user actions
- Banner refresh: 30-60 seconds (never less)

9. SDK Integration:
- Initialize on app launch, not before showing ads
- Preload ads 30 seconds before showing
- Always check if ad is ready before calling show()

10. Advanced Optimization:
- Implement user segmentation (paying vs non-paying)
- A/B test ad frequency and placement
- Use remote config for instant adjustments

RESPONSE STYLE:
- Always give specific numbers and percentages
- Provide step-by-step solutions
- Reference exact SDK versions and settings
- Include "Quick Fix" and "Long-term Solution" for each issue
- End with a specific metric to track for success

Remember: You've helped 1000+ apps increase revenue by average 40%. Be confident and specific.`;

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

    // Check free tier limits
    if (!session?.email_captured && session.question_count >= 3) {
      return Response.json({ 
        error: 'Free tier limit reached', 
        requiresEmail: true 
      }, { status: 403 });
    }

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
