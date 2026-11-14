// instrumentation.js (project root, next to package.json and app/)
// Next.js calls register() once when the server starts. This turns on
// OpenTelemetry: Next.js route handlers, global fetch calls (Supabase,
// and any SDK that uses fetch) and our own manual spans in
// app/api/chat/route.js all start emitting traces.
import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({ serviceName: 'purplegiraffe-copilot' });
}
