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
    console.log('New build request (RESEND_API_KEY not set, logging only):', payload);
    return;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Purple Giraffe <noreply@purplegiraffe.ai>',
      to: process.env.DEMO_REQUEST_NOTIFY_EMAIL || 'hello@purplegiraffe.ai',
      subject: `New build request: ${payload.name}`,
      html: `
        <p><strong>Name:</strong> ${payload.name}</p>
        <p><strong>Email/phone:</strong> ${payload.contact}</p>
        <p><strong>Business or personal:</strong> ${payload.useType || '\u2014'}</p>
        <p><strong>Who will use it:</strong> ${payload.whoWillUse || '\u2014'}</p>
        <p><strong>What they want to build:</strong><br/>${(payload.buildDescription || '').replace(/\n/g, '<br/>')}</p>
        <p><strong>How they handle it today:</strong><br/>${(payload.currentProcess || '').replace(/\n/g, '<br/>')}</p>
        <p><strong>What to track/manage:</strong><br/>${(payload.whatToTrack || '').replace(/\n/g, '<br/>')}</p>
        <p><strong>Ownership preference:</strong> ${payload.ownership || '\u2014'}</p>
        <p><strong>Budget range:</strong> ${payload.budget || '\u2014'}</p>
        <p><strong>Timeline:</strong> ${payload.timeline || '\u2014'}</p>
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
    const {
      name, contact, useType, buildDescription, currentProcess,
      whoWillUse, whatToTrack, ownership, budget, timeline,
    } = await request.json();

    if (!name || !contact) {
      return Response.json({ error: 'Name and email/phone are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('demo_requests')
      .insert([{
        name,
        email: contact.toLowerCase().trim(),
        message: buildDescription || null,
        business_or_personal: useType || null,
        current_process: currentProcess || null,
        who_will_use: whoWillUse || null,
        what_to_track: whatToTrack || null,
        ownership_preference: ownership || null,
        budget_range: budget || null,
        timeline: timeline || null,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Failed to store demo request:', error);
      return Response.json({ error: 'Failed to submit request. Please try again.' }, { status: 500 });
    }

    await notifyByEmail({ name, contact, useType, buildDescription, currentProcess, whoWillUse, whatToTrack, ownership, budget, timeline });

    return Response.json({ success: true, message: 'Thanks — we will be in touch shortly.' });

  } catch (error) {
    console.error('Demo request error:', error);
    return Response.json({ error: 'Failed to submit request. Please try again.' }, { status: 500 });
  }
}
