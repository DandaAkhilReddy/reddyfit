'use client'

import { motion } from 'framer-motion'
import MaskButton from '@/components/transitions/MaskButton'
import { Activity, Heart, Brain, Users, Zap, TrendingUp, Watch, Camera, Shield } from 'lucide-react'

const features = [
  {
    icon: Activity,
    title: 'Multi-Source Data Integration',
    description: 'Sync data from Whoop, Apple HealthKit, or manual entry. All your fitness data in one place.',
    benefits: [
      'Automatic workout sync from Whoop and Apple Watch',
      'Manual entry for gym sessions and activities',
      'Unified dashboard across all data sources',
      'Real-time background sync'
    ]
  },
  {
    icon: Heart,
    title: 'Advanced Heart Rate Analytics',
    description: 'Deep insights into your cardiovascular performance with zone-based training.',
    benefits: [
      '5-zone heart rate analysis',
      'HRV tracking and trends',
      'Resting heart rate monitoring',
      'Recovery recommendations'
    ]
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Get personalized recommendations powered by advanced AI analysis.',
    benefits: [
      'Workout suggestions based on recovery',
      'Nutrition optimization',
      'Sleep quality analysis',
      'Performance predictions'
    ]
  },
  {
    icon: Users,
    title: 'Community & Social Features',
    description: 'Connect with like-minded athletes and share your journey.',
    benefits: [
      'Follow friends and training partners',
      'Share workout summaries',
      'Join fitness challenges',
      'Group leaderboards'
    ]
  },
  {
    icon: Zap,
    title: '500+ AI Agents',
    description: 'Access a marketplace of AI agents for every fitness need.',
    benefits: [
      'Nutrition planning agents',
      'Custom workout programs',
      'Recovery optimization',
      'Create and monetize your own agents'
    ]
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description: 'Visualize your fitness journey with comprehensive analytics.',
    benefits: [
      'Photo progress comparisons',
      'Performance trends over time',
      'Goal setting and tracking',
      'Detailed workout history'
    ]
  },
  {
    icon: Watch,
    title: 'Wearable Integration',
    description: 'Seamless integration with your favorite fitness devices.',
    benefits: [
      'Whoop strap complete sync',
      'Apple Watch and HealthKit',
      'Automatic activity detection',
      'Real-time data updates'
    ]
  },
  {
    icon: Camera,
    title: 'Photo Steganography',
    description: 'Advanced privacy with encrypted workout data in photos.',
    benefits: [
      'LSB + EXIF dual embedding',
      'RSA signature verification',
      'Privacy-first data storage',
      'Tamper detection'
    ]
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level security for your fitness data.',
    benefits: [
      'End-to-end encryption',
      'Firebase secure authentication',
      'GDPR compliant',
      'Regular security audits'
    ]
  }
]

const dataSources = [
  {
    name: 'Whoop',
    tier: 'Elite/Platinum',
    description: 'Complete integration with Whoop API',
    features: [
      'Strain score',
      'Recovery percentage',
      'Sleep performance',
      'HRV analysis',
      'Respiratory rate',
      'Skin temperature'
    ],
    icon: '⌚'
  },
  {
    name: 'Apple HealthKit',
    tier: 'Pro/Elite',
    description: 'Deep Apple Watch and Health app sync',
    features: [
      'Workout auto-detection',
      'Heart rate zones',
      'Activity rings',
      'VO2 Max',
      'Steps and distance',
      'Background sync'
    ],
    icon: '🍎'
  },
  {
    name: 'Manual Entry',
    tier: 'All Tiers',
    description: 'Quick and easy workout logging',
    features: [
      'Custom exercise types',
      'Photo uploads',
      'Notes and tags',
      'Duration and calories',
      'Heart rate zones',
      'Distance tracking'
    ],
    icon: '✍️'
  }
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Everything You Need to <span className="gradient-text">Excel</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From multi-source data integration to AI-powered insights,
            ReddyFit has all the tools you need to optimize your fitness journey.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20" id="tracking">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-effect rounded-2xl p-8 hover-lift"
            >
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                <feature.icon className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 mb-6">{feature.description}</p>
              <ul className="space-y-2">
                {feature.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Data Sources Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Choose Your <span className="gradient-text">Data Source</span>
            </h2>
            <p className="text-xl text-gray-400">
              From elite athletes to fitness beginners, we support your preferred tracking method
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dataSources.map((source, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="glass-effect rounded-2xl p-8"
              >
                <div className="text-5xl mb-4">{source.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{source.name}</h3>
                <div className="text-sm text-purple-400 mb-4">{source.tier}</div>
                <p className="text-gray-400 mb-6">{source.description}</p>
                <ul className="space-y-2">
                  {source.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-400">•</span>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-effect rounded-3xl p-12 mb-20"
          id="analytics"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Advanced <span className="gradient-text">Analytics</span>
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                Get deep insights into your performance with our comprehensive analytics dashboard.
              </p>
              <ul className="space-y-4">
                {[
                  'Heart rate zone distribution',
                  'Weekly and monthly trends',
                  'Recovery score calculations',
                  'Performance predictions',
                  'Goal progress tracking',
                  'Comparative analysis'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      ✓
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-effect rounded-2xl p-8 aspect-square flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-24 h-24 mx-auto mb-4 text-purple-400" />
                <div className="text-gray-400">Analytics Dashboard Preview</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of athletes using ReddyFit to optimize their training
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MaskButton variant="primary" href="/download" className="px-8 py-4 text-lg">
              Download Now
            </MaskButton>
            <MaskButton variant="secondary" href="/pricing" className="px-8 py-4 text-lg">
              View Pricing
            </MaskButton>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
