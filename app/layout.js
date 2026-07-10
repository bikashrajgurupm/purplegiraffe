// app/layout.js
import './globals.css'

export const metadata = {
  title: 'Purple Giraffe — Custom apps for your business',
  description: 'Purple Giraffe builds custom apps and workflow tools for businesses and individuals: order trackers, booking tools, dashboards, customer portals, inventory systems and more.',
  metadataBase: new URL('https://purplegiraffe.ai'),
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Purple Giraffe — Custom apps for your business',
    description: 'Tell us your workflow. We build the app. Explore examples, then request a custom build for your own use case.',
    url: 'https://purplegiraffe.ai',
    siteName: 'Purple Giraffe',
    type: 'website',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8b5cf6',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
