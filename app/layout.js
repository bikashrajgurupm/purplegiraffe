// app/layout.js
import './globals.css'

export const metadata = {
  title: 'Purple Giraffe — AI applications for your business',
  description: 'Purple Giraffe designs and builds custom AI applications for small businesses, enterprises, and individuals. Try a working prototype, then request a build for your own use case.',
  metadataBase: new URL('https://purplegiraffe.ai'),
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Purple Giraffe — AI applications for your business',
    description: 'Browse working AI prototypes across industries, then request a custom build for your own business.',
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
