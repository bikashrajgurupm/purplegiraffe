// app/apps/copilot/layout.js
import { APP_NAME, APP_TAGLINE } from './config'

export const metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: 'Ask about eCPM drops, waterfall setup, fill-rate issues, and ad-network troubleshooting. Upload a dashboard screenshot or PDF for analysis.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  openGraph: {
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: 'Ask about eCPM drops, waterfall setup, fill-rate issues, and ad-network troubleshooting.',
    url: 'https://purplegiraffe.ai/apps/copilot',
    siteName: 'Purple Giraffe',
    type: 'website',
  },
}

export default function CopilotLayout({ children }) {
  return children
}
