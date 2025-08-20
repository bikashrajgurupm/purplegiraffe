// app/layout.js
import './globals.css'

export const metadata = {
  title: 'Purple Giraffe - AI Monetization Assistant',
  description: 'Expert AI assistant for app monetization, ad networks, and revenue optimization',
  metadataBase: new URL('https://purplegiraffe.in'),
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',  // ADD THIS
  appleWebApp: {              // ADD THIS SECTION
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Purple Giraffe',
  },
  openGraph: {                // ADD THIS SECTION (optional but good for sharing)
    title: 'Purple Giraffe - AI Monetization Assistant',
    description: 'Expert AI assistant for app monetization optimization',
    url: 'https://purplegiraffe.in',
    siteName: 'Purple Giraffe',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* ADD THESE META TAGS FOR BETTER MOBILE SUPPORT */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
