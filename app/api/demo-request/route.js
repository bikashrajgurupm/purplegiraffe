// app/api/demo-request/route.js
// Powers the "Request a build" form on the main Purple Giraffe homepage.
// Deliberately independent of the Purple Giraffe Copilot tables (users,
// sessions, questions, chat_history) — this writes to its own
// demo_requests table so the adtech app's data model stays untouched.
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function notifyByEmail(payload) {
  if (!process.env.RESEND_API_KEY) {
    console.log('New demo request (RESEND_API_KEY not set, logging only):', payload);
    return;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Purple Giraffe <noreply@purplegiraffe.ai>',
      to: process.env.DEMO_REQUEST_NOTIFY_EMAIL || 'hello@purplegiraffe.ai',
      subject: `New build request: ${payload.useCase || 'General'} — ${payload.name}`,
      html: `
        <p><strong>Name:</strong> ${payload.name}</p>
        <p><strong>Email:</strong> ${payload.email}</p>
        <p><strong>Company:</strong> ${payload.company || '—'}</p>
        <p><strong>Closest prototype:</strong> ${payload.useCase || '—'}</p>
        <p><strong>Message:</strong><br/>${(payload.message || '').replace(/\n/g, '<br/>')}</p>
      `
    });
  } catch (error) {
    // Never fail the request just because the notification email failed —
    // the row is already saved in demo_requests, which is the source of truth.
    console.error('Failed to send demo request notification email:', error);
  }
}

export async function POST(request) {
  try {
    const { name, email, company, useCase, message } = await request.json();

    if (!name || !email) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('demo_requests')
      .insert([{
        name,
        email: email.toLowerCase().trim(),
        company: company || null,
        use_case: useCase || null,
        message: message || null,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Failed to store demo request:', error);
      return Response.json({ error: 'Failed to submit request. Please try again.' }, { status: 500 });
    }

    await notifyByEmail({ name, email, company, useCase, message });

    return Response.json({ success: true, message: 'Thanks — we will be in touch shortly.' });

  } catch (error) {
    console.error('Demo request error:', error);
    return Response.json({ error: 'Failed to submit request. Please try again.' }, { status: 500 });
  }
}
