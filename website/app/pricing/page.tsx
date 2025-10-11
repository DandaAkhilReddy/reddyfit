'use client'

import { motion } from 'framer-motion'
import MaskButton from '@/components/transitions/MaskButton'
import { Check, X } from 'lucide-react'

interface PricingTier {
  name: string
  price: number
  dataSource: string
  description: string
  features: Array<{ name: string; included: boolean }>
  popular?: boolean
  cta: string
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: 29,
    dataSource: 'Manual Entry',
    description: 'Perfect for beginners tracking their fitness journey',
    features: [
      { name: 'Manual workout entry', included: true },
      { name: 'Photo uploads', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Community access', included: true },
      { name: '5 AI agent uses/month', included: true },
      { name: 'Whoop integration', included: false },
      { name: 'Apple HealthKit sync', included: false },
      { name: 'Unlimited AI agents', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Priority support', included: false }
    ],
    cta: 'Start Free Trial'
  },
  {
    name: 'Pro',
    price: 69,
    dataSource: 'Apple HealthKit',
    description: 'For serious athletes with Apple Watch',
    features: [
      { name: 'Manual workout entry', included: true },
      { name: 'Photo uploads', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Community access', included: true },
      { name: '20 AI agent uses/month', included: true },
      { name: 'Whoop integration', included: false },
      { name: 'Apple HealthKit sync', included: true },
      { name: 'Unlimited AI agents', included: false },
      { name: 'Advanced analytics', included: true },
      { name: 'Priority support', included: false }
    ],
    popular: true,
    cta: 'Start Free Trial'
  },
  {
    name: 'Elite',
    price: 149,
    dataSource: 'Whoop + HealthKit',
    description: 'Complete integration for elite performance',
    features: [
      { name: 'Manual workout entry', included: true },
      { name: 'Photo uploads', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Community access', included: true },
      { name: 'Unlimited AI agent uses', included: true },
      { name: 'Whoop integration', included: true },
      { name: 'Apple HealthKit sync', included: true },
      { name: 'Unlimited AI agents', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Priority support', included: true }
    ],
    cta: 'Start Free Trial'
  },
  {
    name: 'Platinum',
    price: 299,
    dataSource: 'All Sources + White Glove',
    description: 'Premium experience with dedicated support',
    features: [
      { name: 'Manual workout entry', included: true },
      { name: 'Photo uploads', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Community access', included: true },
      { name: 'Unlimited AI agent uses', included: true },
      { name: 'Whoop integration', included: true },
      { name: 'Apple HealthKit sync', included: true },
      { name: 'Unlimited AI agents', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Priority support', included: true },
      { name: '1-on-1 coaching calls', included: true },
      { name: 'Custom agent development', included: true }
    ],
    cta: 'Contact Sales'
  }
]

const faqs = [
  {
    question: 'Can I switch between plans?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate the difference.'
  },
  {
    question: 'What happens to my data if I downgrade?',
    answer: 'All your historical data is preserved. You\'ll only lose access to premium features like advanced analytics or certain integrations.'
  },
  {
    question: 'Do I need a Whoop membership for Elite tier?',
    answer: 'Yes, Elite and Platinum tiers require an active Whoop membership since we sync data from their API.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! All plans include a 14-day free trial. No credit card required to start.'
  },
  {
    question: 'How does AI agent usage work?',
    answer: 'Starter gets 5 uses/month, Pro gets 20, and Elite/Platinum get unlimited. One "use" is one AI query or recommendation.'
  },
  {
    question: 'Can I create and sell AI agents on all plans?',
    answer: 'Yes! All users can create agents. You earn 70% revenue share when others subscribe to your agents.'
  }
]

export default function PricingPage() {
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
            Simple, <span className="gradient-text">Transparent Pricing</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Choose the plan that fits your fitness tracking needs. All plans include community access
            and the ability to create AI agents.
          </p>
          <div className="inline-block glass-effect rounded-full px-6 py-3">
            <span className="text-green-400 font-semibold">🎉 14-day free trial on all plans</span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-effect rounded-2xl p-8 flex flex-col ${
                tier.popular ? 'border-2 border-purple-500 scale-105' : ''
              }`}
            >
              {tier.popular && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4 text-center">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="text-sm text-purple-400 mb-4">{tier.dataSource}</div>
              <div className="mb-4">
                <span className="text-4xl font-bold gradient-text">${tier.price}</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">{tier.description}</p>

              <MaskButton
                variant={tier.popular ? 'primary' : 'secondary'}
                href="/download"
                className="w-full mb-6"
              >
                {tier.cta}
              </MaskButton>

              <div className="space-y-3 flex-1">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            Detailed <span className="gradient-text">Comparison</span>
          </h2>

          <div className="glass-effect rounded-2xl p-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4">Feature</th>
                  {tiers.map((tier) => (
                    <th key={tier.name} className="text-center py-4 px-4">
                      <div className="font-bold">{tier.name}</div>
                      <div className="text-sm text-gray-400 font-normal">${tier.price}/mo</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tiers[0].features.map((_, featureIndex) => (
                  <tr key={featureIndex} className="border-b border-white/10">
                    <td className="py-4 px-4 text-gray-300">
                      {tiers[0].features[featureIndex].name}
                    </td>
                    {tiers.map((tier) => (
                      <td key={tier.name} className="text-center py-4 px-4">
                        {tier.features[featureIndex]?.included ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-xl p-6"
              >
                <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
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
            Still Have Questions?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Our team is here to help you choose the right plan
          </p>
          <MaskButton variant="primary" href="/contact" className="px-8 py-4 text-lg">
            Contact Sales
          </MaskButton>
        </motion.div>
      </div>
    </div>
  )
}
