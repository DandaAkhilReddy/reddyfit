'use client'

import { motion } from 'framer-motion'
import MaskButton from '@/components/transitions/MaskButton'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                Lose Weight
                <span className="block gradient-text">Sustainably</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                Powered by Your Body's Data. AI weight loss that adapts to your recovery.
                Use Whoop, Apple HealthKit, or manual tracking.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <MaskButton variant="primary" href="/download" className="text-lg px-8 py-4">
                  Get Started Free
                </MaskButton>
                <MaskButton variant="secondary" href="/dashboard" className="text-lg px-8 py-4">
                  View Demo
                </MaskButton>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold gradient-text">15-20</div>
                  <div className="text-sm text-gray-400">lbs Lost (Avg)</div>
                </div>
                <div>
                  <div className="text-3xl font-bold gradient-text">92%</div>
                  <div className="text-sm text-gray-400">Keep It Off</div>
                </div>
                <div>
                  <div className="text-3xl font-bold gradient-text">Zero</div>
                  <div className="text-sm text-gray-400">Burnout Risk</div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - App Preview */}
            <div className="relative">
              <div className="relative glass-effect rounded-3xl p-8 hover-lift">
                <div className="aspect-[9/16] bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📱</div>
                    <div className="text-gray-400">iOS App Preview</div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                className="absolute -top-6 -right-6 glass-effect rounded-2xl p-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="text-2xl">💪</div>
              </motion.div>

              <motion.div
                className="absolute -bottom-6 -left-6 glass-effect rounded-2xl p-4"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              >
                <div className="text-2xl">🎯</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Lose Weight</span>
            </h2>
            <p className="text-xl text-gray-400">
              Recovery-based plans, AI meal recommendations, and sustainable results
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "⌚",
                title: "Multi-Source Tracking",
                description: "Sync from Whoop, Apple Watch, or enter manually. Your data, your way.",
                link: "/features#tracking"
              },
              {
                icon: "🤖",
                title: "AI Agent Marketplace",
                description: "Access 500+ AI agents for nutrition, workouts, and wellness. Create your own and earn.",
                link: "/agents"
              },
              {
                icon: "📊",
                title: "Advanced Analytics",
                description: "Heart rate zones, recovery metrics, and personalized insights powered by AI.",
                link: "/features#analytics"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Link href={feature.link}>
                  <div className="glass-effect rounded-2xl p-8 hover-lift cursor-pointer group">
                    <div className="text-5xl mb-4">{feature.icon}</div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:gradient-text transition-all">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <MaskButton variant="primary" href="/features" className="px-8 py-3">
              Explore All Features
            </MaskButton>
          </motion.div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="py-20 bg-black/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your <span className="gradient-text">Data Source</span>
            </h2>
            <p className="text-xl text-gray-400">
              From beginner to elite athlete, we've got you covered
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Whoop",
                tier: "Elite",
                price: "$149-299",
                features: ["Complete Whoop integration", "Strain & recovery", "Sleep analysis", "HRV tracking"],
                popular: true
              },
              {
                name: "Apple HealthKit",
                tier: "Pro",
                price: "$69",
                features: ["Apple Watch sync", "Heart rate zones", "Auto workout detection", "Activity rings"],
                popular: false
              },
              {
                name: "Manual Entry",
                tier: "Starter",
                price: "$29",
                features: ["Quick workout logging", "Photo uploads", "Basic analytics", "Community access"],
                popular: false
              }
            ].map((source, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className={`glass-effect rounded-2xl p-8 hover-lift ${source.popular ? 'border-2 border-purple-500' : ''}`}>
                  {source.popular && (
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{source.name}</h3>
                  <div className="text-gray-400 mb-4">{source.tier} Tier</div>
                  <div className="text-3xl font-bold gradient-text mb-6">{source.price}/mo</div>
                  <ul className="space-y-3 mb-8">
                    {source.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-400 mr-2">✓</span>
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <MaskButton variant={source.popular ? "primary" : "secondary"} href="/pricing" className="w-full">
                    Learn More
                  </MaskButton>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Agents Teaser */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Build & Monetize <span className="gradient-text">AI Agents</span>
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                Join our creator economy. Build custom AI agents for nutrition, workouts,
                or wellness. Share them with the community and earn 70% revenue share.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🎨</span>
                  <div>
                    <div className="font-semibold">No-Code Builder</div>
                    <div className="text-gray-400">Create agents with our visual builder</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">💰</span>
                  <div>
                    <div className="font-semibold">70% Revenue Share</div>
                    <div className="text-gray-400">Earn from every user who uses your agent</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🌍</span>
                  <div>
                    <div className="font-semibold">Global Marketplace</div>
                    <div className="text-gray-400">Reach thousands of fitness enthusiasts</div>
                  </div>
                </li>
              </ul>
              <div className="flex gap-4">
                <MaskButton variant="primary" href="/agents">
                  Browse Agents
                </MaskButton>
                <MaskButton variant="secondary" href="/agents#create">
                  Start Creating
                </MaskButton>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { emoji: "🥗", name: "Vegan Meal Planner", users: "2.3K" },
                { emoji: "🏋️", name: "Strength Coach", users: "5.1K" },
                { emoji: "🧘", name: "Recovery Expert", users: "3.8K" },
                { emoji: "🏃", name: "Marathon Trainer", users: "4.2K" }
              ].map((agent, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-effect rounded-xl p-6 hover-lift cursor-pointer"
                >
                  <div className="text-4xl mb-3">{agent.emoji}</div>
                  <div className="font-semibold mb-1">{agent.name}</div>
                  <div className="text-sm text-gray-400">{agent.users} users</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Fitness?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of athletes using ReddyFit to track, analyze, and optimize their performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <MaskButton variant="primary" href="/download" className="text-lg px-8 py-4">
                Download Now
              </MaskButton>
              <MaskButton variant="ghost" href="/pricing" className="text-lg px-8 py-4">
                View Pricing
              </MaskButton>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
