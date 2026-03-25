import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Providers } from './providers'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Wealthcheck - UK Personal Finance Tracker',
  description:
    'Interactive tool to map your personal finances onto the UKPF flowchart journey',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={ibmPlexSans.className}>
        <Providers>
          <TooltipProvider>
            <div className="min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
                {children}
              </main>
              <Footer />
            </div>
          </TooltipProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
