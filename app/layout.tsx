import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'Emoji Hub',
    template: '%s · Emoji Hub',
  },
  description:
    'Browse every emoji with descriptions and generational meanings in English, Russian and Kazakh.',
}

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <Providers>
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
