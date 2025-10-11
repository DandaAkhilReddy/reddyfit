'use client'

import Link from 'next/link'
import { useState } from 'react'
import MaskButton from '../transitions/MaskButton'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl">
              RF
            </div>
            <span className="text-xl font-bold gradient-text">ReddyFit</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="hover:text-blue-400 transition-colors">
              Features
            </Link>
            <Link href="/agents" className="hover:text-blue-400 transition-colors">
              AI Agents
            </Link>
            <Link href="/pricing" className="hover:text-blue-400 transition-colors">
              Pricing
            </Link>
            <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
              Demo
            </Link>
            <Link href="/download" className="hover:text-blue-400 transition-colors">
              Download
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <MaskButton variant="ghost" href="/waitlist">
              Join Waitlist
            </MaskButton>
            <MaskButton variant="primary" href="/download">
              Get Started
            </MaskButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4">
            <Link href="/features" className="block hover:text-blue-400">Features</Link>
            <Link href="/agents" className="block hover:text-blue-400">AI Agents</Link>
            <Link href="/pricing" className="block hover:text-blue-400">Pricing</Link>
            <Link href="/dashboard" className="block hover:text-blue-400">Demo</Link>
            <Link href="/download" className="block hover:text-blue-400">Download</Link>
            <div className="pt-4 space-y-2">
              <MaskButton variant="ghost" href="/login" className="w-full">
                Sign In
              </MaskButton>
              <MaskButton variant="primary" href="/download" className="w-full">
                Get Started
              </MaskButton>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
