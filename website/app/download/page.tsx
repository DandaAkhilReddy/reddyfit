'use client'

import { motion } from 'framer-motion'
import MaskButton from '@/components/transitions/MaskButton'
import { Apple, Smartphone, Check } from 'lucide-react'

export default function DownloadPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Download <span className="gradient-text">ReddyFit</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Get started with ReddyFit today. Available on iOS with Android coming soon.
            Choose your plan and start your 14-day free trial.
          </p>
        </motion.div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {/* iOS Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-2xl p-8 border-2 border-purple-500"
          >
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl w-16 h-16 flex items-center justify-center mb-6">
              <Apple className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-4">iOS App</h2>
            <p className="text-gray-400 mb-6">
              Full-featured iOS app with Apple HealthKit integration, Whoop sync,
              and all AI agents available.
            </p>

            <div className="space-y-3 mb-8">
              {[
                'iOS 15.0 or later',
                'iPhone and iPad support',
                'Apple Watch integration',
                'HealthKit sync',
                'Whoop integration',
                'Offline mode'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <MaskButton variant="primary" href="https://apps.apple.com/reddyfit" className="w-full py-4 text-lg">
              <Apple className="w-6 h-6 inline mr-2" />
              Download on App Store
            </MaskButton>

            <div className="mt-4 text-center text-sm text-green-400">
              ✓ Available Now
            </div>
          </motion.div>

          {/* Android Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect rounded-2xl p-8 opacity-60"
          >
            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl w-16 h-16 flex items-center justify-center mb-6">
              <Smartphone className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Android App</h2>
            <p className="text-gray-400 mb-6">
              Coming soon! Full Android app with Google Fit integration and all features.
            </p>

            <div className="space-y-3 mb-8">
              {[
                'Android 8.0 or later',
                'Phone and tablet support',
                'Wear OS integration',
                'Google Fit sync',
                'Whoop integration',
                'Offline mode'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-500">{feature}</span>
                </div>
              ))}
            </div>

            <MaskButton variant="ghost" className="w-full py-4 text-lg cursor-not-allowed" onClick={() => {}}>
              <Smartphone className="w-6 h-6 inline mr-2" />
              Coming Soon
            </MaskButton>

            <div className="mt-4 text-center text-sm text-gray-500">
              Expected Q2 2025
            </div>
          </motion.div>
        </div>

        {/* Getting Started Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            Get Started in <span className="gradient-text">3 Easy Steps</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Download & Sign Up',
                description: 'Download the app and create your free account. No credit card required for the trial.'
              },
              {
                step: '2',
                title: 'Choose Your Plan',
                description: 'Select from Starter, Pro, Elite, or Platinum based on your data source preference.'
              },
              {
                step: '3',
                title: 'Connect & Track',
                description: 'Connect your Whoop, Apple Watch, or start manual tracking. Your fitness journey begins!'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="glass-effect rounded-2xl p-6 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* System Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-effect rounded-2xl p-8 max-w-4xl mx-auto mb-20"
        >
          <h2 className="text-2xl font-bold mb-6">System Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Apple className="w-5 h-5" />
                iOS Requirements
              </h3>
              <ul className="space-y-2 text-gray-400">
                <li>• iOS 15.0 or later</li>
                <li>• iPhone 8 or newer</li>
                <li>• 100 MB available storage</li>
                <li>• Internet connection for sync</li>
                <li>• Optional: Apple Watch for HealthKit</li>
                <li>• Optional: Whoop membership for Elite tier</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Android Requirements (Coming Soon)
              </h3>
              <ul className="space-y-2 text-gray-400">
                <li>• Android 8.0 or later</li>
                <li>• 100 MB available storage</li>
                <li>• Internet connection for sync</li>
                <li>• Optional: Wear OS device</li>
                <li>• Optional: Whoop membership for Elite tier</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            Common <span className="gradient-text">Questions</span>
          </h2>

          <div className="space-y-6">
            {[
              {
                question: 'Is there a free trial?',
                answer: 'Yes! All plans include a 14-day free trial. No credit card required to start.'
              },
              {
                question: 'Can I use ReddyFit without a Whoop or Apple Watch?',
                answer: 'Absolutely! Our Starter plan ($29/mo) supports manual workout entry and is perfect for tracking without wearables.'
              },
              {
                question: 'How do I cancel my subscription?',
                answer: 'You can cancel anytime from your account settings. Cancellations are effective at the end of your billing period.'
              },
              {
                question: 'Will my data sync between devices?',
                answer: 'Yes! All your data syncs in real-time across all your devices via Firebase.'
              },
              {
                question: 'When is the Android app coming?',
                answer: 'We\'re targeting Q2 2025 for the Android release. Sign up to our waitlist to be notified!'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-400">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Fitness?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Download ReddyFit now and start your 14-day free trial
          </p>
          <MaskButton variant="primary" href="https://apps.apple.com/reddyfit" className="px-8 py-4 text-lg">
            <Apple className="w-6 h-6 inline mr-2" />
            Download for iOS
          </MaskButton>
        </motion.div>
      </div>
    </div>
  )
}
