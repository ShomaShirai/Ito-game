import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ito Game',
  description: 'A fun and interactive game for everyone',
  generator: 'ShomaShirai',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
