import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/sections/Navigation'

export const metadata: Metadata = {
  metadataBase: new URL('https://reddyfit.vercel.app'),
  title: 'ReddyFit - Elite Fitness Tracking with AI',
  description: 'Multi-source fitness tracking with Whoop, Apple HealthKit, and AI-powered insights. Create and share custom AI fitness agents.',
  keywords: 'fitness, workout tracking, whoop, apple health, AI agents, nutrition tracking',
  openGraph: {
    title: 'ReddyFit - Elite Fitness Tracking',
    description: 'Track your fitness with Whoop, Apple Watch, or manual entry. AI-powered insights and custom agent marketplace.',
    type: 'website',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Navigation />
        <main className="relative">
          {children}
        </main>
        <footer className="border-t border-white/10 bg-black/30 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold gradient-text mb-4">ReddyFit</h3>
                <p className="text-gray-400 text-sm">
                  Elite fitness tracking with AI-powered insights
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/features" className="hover:text-white">Features</a></li>
                  <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
                  <li><a href="/agents" className="hover:text-white">AI Agents</a></li>
                  <li><a href="/download" className="hover:text-white">Download</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Integrations</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>Whoop</li>
                  <li>Apple HealthKit</li>
                  <li>Manual Entry</li>
                  <li>Coming Soon...</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Community</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white">Discord</a></li>
                  <li><a href="#" className="hover:text-white">Twitter</a></li>
                  <li><a href="#" className="hover:text-white">Blog</a></li>
                  <li><a href="#" className="hover:text-white">Creator Program</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-400">
              <p>&copy; 2025 ReddyFit. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
