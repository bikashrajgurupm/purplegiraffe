// app/layout.js
import './globals.css'

export const metadata = {
  title: 'Purple Giraffe - AI Monetization Assistant',  // Space added between Purple and Giraffe
  description: 'Expert AI assistant for app monetization, ad networks, and revenue optimization',
  metadataBase: new URL('https://purplegiraffe.in'),
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  icons: {
    icon: '/logo.png',  // Or '/favicon.ico' if you've converted it
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
