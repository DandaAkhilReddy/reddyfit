'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import MaskButton from '@/components/transitions/MaskButton'
import { CheckCircle, Mail, Twitter, MessageCircle, Sparkles, Copy, Share2, Trophy, TrendingUp } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function WaitlistSuccessContent() {
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [position, setPosition] = useState<number | null>(null)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const userName = searchParams.get('name') || 'there'
    const userPosition = searchParams.get('position')
    const userReferralCode = searchParams.get('referralCode')

    setName(userName)
    if (userPosition) setPosition(parseInt(userPosition))
    if (userReferralCode) setReferralCode(userReferralCode)

    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }, [searchParams])

  const siteUrl = 'https://salmon-mud-01e8ee30f.2.azurestaticapps.net'
  const referralLink = referralCode ? `${siteUrl}/waitlist?ref=${referralCode}` : ''

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareOnTwitter = () => {
    const text = position
      ? `I just joined the @ReddyFit waitlist and I'm #${position}! 🎉\n\nGet your spot before launch:`
      : `I just joined the @ReddyFit waitlist! 🎉\n\nGet your spot before launch:`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`
    window.open(url, '_blank')
  }

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`
    window.open(url, '_blank')
  }

  // Position-based perks
  let perksTitle = 'Early Access Benefits'
  let perksDescription = 'Early access to all features'
  let badgeColor = 'from-gray-500 to-gray-600'
  let badgeIcon = <Sparkles className="w-8 h-8 text-white" />

  if (position) {
    if (position <= 50) {
      perksTitle = '🏆 Founder Status!'
      perksDescription = 'Lifetime 50% discount + Exclusive Discord access + Founder badge'
      badgeColor = 'from-yellow-500 to-amber-600'
      badgeIcon = <Trophy className="w-8 h-8 text-white" />
    } else if (position <= 100) {
      perksTitle = '🎖️ Early Bird!'
      perksDescription = 'Lifetime 40% discount + Priority support'
      badgeColor = 'from-blue-500 to-blue-600'
      badgeIcon = <TrendingUp className="w-8 h-8 text-white" />
    } else if (position <= 500) {
      perksTitle = '⭐ Insider!'
      perksDescription = 'First 3 months 50% off + Beta access Week 3'
      badgeColor = 'from-purple-500 to-purple-600'
      badgeIcon = <Sparkles className="w-8 h-8 text-white" />
    } else if (position <= 1000) {
      perksTitle = '🎯 Early Access!'
      perksDescription = 'First month 50% off'
      badgeColor = 'from-green-500 to-emerald-600'
      badgeIcon = <CheckCircle className="w-8 h-8 text-white" />
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-block">
              <div className="relative">
                <motion.div
                  className={`w-32 h-32 bg-gradient-to-br ${badgeColor} rounded-full flex items-center justify-center mx-auto shadow-2xl`}
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {badgeIcon}
                </motion.div>

                {/* Sparkle effects */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `rotate(${i * 60}deg) translateY(-80px)`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Position Badge */}
          {position && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <div className="inline-block px-8 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-full">
                <p className="text-3xl font-bold text-green-400">
                  You're #{position} on the waitlist! 🎉
                </p>
              </div>
            </motion.div>
          )}

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to <span className="gradient-text">ReddyFit</span>!
            </h1>
            <p className="text-2xl text-gray-300 mb-8">
              Thanks for joining, <strong className="gradient-text">{name}</strong>!
            </p>
          </motion.div>

          {/* Perks Card */}
          {position && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-effect rounded-3xl p-8 mb-8 border-2 border-purple-500/30"
            >
              <h2 className="text-3xl font-bold mb-4">{perksTitle}</h2>
              <p className="text-lg text-gray-300 mb-6">{perksDescription}</p>
            </motion.div>
          )}

          {/* Referral Section */}
          {referralLink && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-effect rounded-3xl p-8 mb-8 border-2 border-green-500/30"
            >
              <h2 className="text-3xl font-bold mb-4">🚀 Move Up the Waitlist!</h2>
              <p className="text-lg text-gray-300 mb-6">
                Share your unique referral link and <strong className="text-green-400">move up 10 positions</strong> for each friend who joins!
              </p>

              {/* Referral Link Box */}
              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                <p className="text-sm text-gray-400 mb-2">Your Referral Link:</p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 bg-transparent text-blue-400 text-sm px-3 py-2 rounded-lg border border-white/10 focus:outline-none"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={shareOnTwitter}
                  className="px-6 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                  Share on Twitter
                </button>
                <button
                  onClick={shareOnLinkedIn}
                  className="px-6 py-3 bg-[#0A66C2] hover:bg-[#084d94] rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Share on LinkedIn
                </button>
              </div>

              {/* Referral Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="glass-effect rounded-xl p-4">
                  <p className="text-2xl font-bold text-green-400">10</p>
                  <p className="text-sm text-gray-400">Spots per referral</p>
                </div>
                <div className="glass-effect rounded-xl p-4">
                  <p className="text-2xl font-bold text-purple-400">∞</p>
                  <p className="text-sm text-gray-400">Unlimited referrals</p>
                </div>
                <div className="glass-effect rounded-xl p-4">
                  <p className="text-2xl font-bold text-yellow-400">🏆</p>
                  <p className="text-sm text-gray-400">Top 10 bonus perks</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* What's Next Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-effect rounded-3xl p-8 mb-8"
          >
            <h2 className="text-3xl font-bold mb-6">What Happens Next?</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-effect rounded-xl p-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Check Your Email</h3>
                <p className="text-sm text-gray-400">
                  We just sent you a confirmation email with your position and referral link.
                </p>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Climb the List</h3>
                <p className="text-sm text-gray-400">
                  Share your referral link to move up and unlock better perks!
                </p>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Launch Access</h3>
                <p className="text-sm text-gray-400">
                  We'll notify you when ReddyFit launches with your exclusive perks!
                </p>
              </div>
            </div>
          </motion.div>

          {/* Social & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-semibold mb-4">Stay Connected</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <MaskButton variant="secondary" href="https://twitter.com/reddyfit" className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Follow on Twitter
                </MaskButton>
                <MaskButton variant="secondary" href="#" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Join Discord
                </MaskButton>
              </div>
            </div>

            <div>
              <MaskButton variant="primary" href="/" className="px-8 py-3">
                Back to Homepage
              </MaskButton>
            </div>
          </motion.div>

          {/* Emoji Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12 text-4xl"
          >
            💪 🎯 🚀 ⚡ 🔥
          </motion.div>
        </div>
      </div>
    </div>
  )
}
