'use client'

import { useState } from 'react'
import { PinterestCard, PinterestGrid } from '@/components/transitions/PinterestGrid'
import MaskButton from '@/components/transitions/MaskButton'
import { motion } from 'framer-motion'
import { Star, Users, TrendingUp, Zap } from 'lucide-react'

interface Agent {
  id: string
  name: string
  category: 'nutrition' | 'workout' | 'wellness'
  emoji: string
  description: string
  creator: string
  users: string
  rating: number
  price: number
  features: string[]
  detailedDescription: string
}

const agents: Agent[] = [
  {
    id: '1',
    name: 'Vegan Meal Planner',
    category: 'nutrition',
    emoji: '🥗',
    description: 'AI-powered plant-based meal plans tailored to your goals',
    creator: 'Sarah Chen',
    users: '2.3K',
    rating: 4.9,
    price: 9.99,
    features: ['Macro tracking', 'Recipe suggestions', 'Shopping lists', 'Nutrient analysis'],
    detailedDescription: 'Get personalized vegan meal plans based on your fitness goals, dietary restrictions, and taste preferences. Includes macro tracking, recipe database with 1000+ vegan meals, and automated shopping lists.'
  },
  {
    id: '2',
    name: 'Strength Coach Pro',
    category: 'workout',
    emoji: '🏋️',
    description: 'Progressive overload programs for maximum muscle growth',
    creator: 'Mike Torres',
    users: '5.1K',
    rating: 4.8,
    price: 14.99,
    features: ['Custom programs', 'Form videos', 'Progress tracking', 'Deload planning'],
    detailedDescription: 'Science-based strength training programs with progressive overload. Automatically adjusts based on your performance, includes form check videos, and periodization strategies for continuous gains.'
  },
  {
    id: '3',
    name: 'Recovery Expert',
    category: 'wellness',
    emoji: '🧘',
    description: 'Optimize recovery with sleep, HRV, and mobility guidance',
    creator: 'Dr. Lisa Park',
    users: '3.8K',
    rating: 4.9,
    price: 12.99,
    features: ['Sleep optimization', 'HRV analysis', 'Mobility routines', 'Stress management'],
    detailedDescription: 'Comprehensive recovery optimization using your Whoop/HealthKit data. Analyzes HRV trends, provides sleep hygiene recommendations, and creates personalized mobility routines to prevent injury.'
  },
  {
    id: '4',
    name: 'Marathon Trainer',
    category: 'workout',
    emoji: '🏃',
    description: 'Complete marathon training with pace strategies',
    creator: 'James Wilson',
    users: '4.2K',
    rating: 4.7,
    price: 11.99,
    features: ['Training plans', 'Pace calculator', 'Race day strategy', 'Taper planning'],
    detailedDescription: '16-week marathon training plans adapted to your current fitness level. Includes pace zones, long run strategies, taper protocols, and race day nutrition planning.'
  },
  {
    id: '5',
    name: 'Keto Nutrition AI',
    category: 'nutrition',
    emoji: '🥑',
    description: 'Low-carb meal plans with ketosis tracking',
    creator: 'Amanda Rivers',
    users: '3.1K',
    rating: 4.6,
    price: 10.99,
    features: ['Macro targets', 'Keto recipes', 'Ketosis tracking', 'Carb counting'],
    detailedDescription: 'Perfect for keto dieters. Tracks macros, suggests low-carb recipes, monitors ketone levels, and helps you stay in ketosis while reaching your fitness goals.'
  },
  {
    id: '6',
    name: 'HIIT Master',
    category: 'workout',
    emoji: '⚡',
    description: 'High-intensity interval workouts for fat loss',
    creator: 'Carlos Martinez',
    users: '6.5K',
    rating: 4.8,
    price: 8.99,
    features: ['Interval timers', 'Fat burn zones', 'Quick workouts', 'Heart rate guidance'],
    detailedDescription: 'Time-efficient HIIT workouts designed for maximum fat burn. Includes interval timers, heart rate zone guidance, and 15-30 minute sessions you can do anywhere.'
  },
  {
    id: '7',
    name: 'Yoga Flow Guide',
    category: 'wellness',
    emoji: '🧘‍♀️',
    description: 'Daily yoga sequences for flexibility and mindfulness',
    creator: 'Priya Sharma',
    users: '2.9K',
    rating: 4.9,
    price: 7.99,
    features: ['Video sequences', 'Pose library', 'Breath work', 'Meditation guides'],
    detailedDescription: 'Personalized yoga sequences based on your flexibility level and goals. Includes video demonstrations, breathing exercises, and meditation practices for complete mind-body wellness.'
  },
  {
    id: '8',
    name: 'Bodybuilding Stack',
    category: 'workout',
    emoji: '💪',
    description: 'Hypertrophy-focused training with nutrition sync',
    creator: 'Derek Strong',
    users: '4.7K',
    rating: 4.7,
    price: 16.99,
    features: ['Split programs', 'Volume tracking', 'Nutrition timing', 'Supplement guide'],
    detailedDescription: 'Complete bodybuilding system with periodized splits (PPL, Arnold, Bro), volume tracking for optimal hypertrophy, nutrient timing strategies, and evidence-based supplement recommendations.'
  },
  {
    id: '9',
    name: 'Intermittent Fasting',
    category: 'nutrition',
    emoji: '⏰',
    description: 'Fasting protocols with eating window optimization',
    creator: 'Dr. Rachel Green',
    users: '5.3K',
    rating: 4.8,
    price: 6.99,
    features: ['Fasting timers', 'Protocol library', 'Autophagy tracking', 'Hunger management'],
    detailedDescription: 'Master intermittent fasting with multiple protocols (16:8, 20:4, OMAD, 5:2). Includes fasting timers, meal timing optimization, and strategies to manage hunger during fasting windows.'
  }
]

const categories = [
  { id: 'all', name: 'All Agents', icon: Zap },
  { id: 'nutrition', name: 'Nutrition', icon: '🍎' },
  { id: 'workout', name: 'Workout', icon: '💪' },
  { id: 'wellness', name: 'Wellness', icon: '🧘' }
]

export default function AgentsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredAgents = selectedCategory === 'all'
    ? agents
    : agents.filter(agent => agent.category === selectedCategory)

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            AI Agent <span className="gradient-text">Marketplace</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Discover 500+ AI agents created by our community. Get personalized nutrition plans,
            workout programs, and wellness guidance. Or create your own and earn 70% revenue share.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MaskButton variant="primary" href="#create" className="px-8 py-3">
              Create Your Agent
            </MaskButton>
            <MaskButton variant="secondary" href="#browse" className="px-8 py-3">
              Browse Agents
            </MaskButton>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {[
            { label: 'Active Agents', value: '500+', icon: Zap },
            { label: 'Creators', value: '150+', icon: Users },
            { label: 'Total Users', value: '10K+', icon: TrendingUp },
            { label: 'Avg Rating', value: '4.8', icon: Star }
          ].map((stat, index) => (
            <div key={index} className="glass-effect rounded-xl p-6 text-center">
              <stat.icon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3 justify-center mb-12"
          id="browse"
        >
          {categories.map((category) => (
            <MaskButton
              key={category.id}
              variant={selectedCategory === category.id ? 'primary' : 'ghost'}
              onClick={() => setSelectedCategory(category.id)}
              className="px-6 py-2"
            >
              {typeof category.icon === 'string' ? category.icon : ''} {category.name}
            </MaskButton>
          ))}
        </motion.div>

        {/* Pinterest Grid of Agents */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <PinterestGrid columns={3} className="md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
            {filteredAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PinterestCard
                  id={agent.id}
                  className="glass-effect rounded-2xl p-6 h-full"
                  detailContent={
                    <div>
                      {/* Detail View Header */}
                      <div className="flex items-start gap-6 mb-8">
                        <div className="text-6xl">{agent.emoji}</div>
                        <div className="flex-1">
                          <h2 className="text-3xl font-bold mb-2">{agent.name}</h2>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                            <span>by {agent.creator}</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              {agent.rating}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {agent.users} users
                            </span>
                          </div>
                          <div className="text-3xl font-bold gradient-text">
                            ${agent.price}/month
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-3">About This Agent</h3>
                        <p className="text-gray-300 leading-relaxed">
                          {agent.detailedDescription}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">Key Features</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {agent.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-green-400">✓</span>
                              <span className="text-gray-300">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex gap-4">
                        <MaskButton variant="primary" className="flex-1 py-3">
                          Subscribe ${agent.price}/mo
                        </MaskButton>
                        <MaskButton variant="secondary" className="px-6 py-3">
                          Try Free
                        </MaskButton>
                      </div>
                    </div>
                  }
                >
                  {/* Card View */}
                  <div className="text-center">
                    <div className="text-5xl mb-4">{agent.emoji}</div>
                    <h3 className="text-xl font-bold mb-2">{agent.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{agent.description}</p>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        {agent.rating}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Users className="w-4 h-4" />
                        {agent.users}
                      </span>
                    </div>
                    <div className="text-lg font-bold gradient-text mb-3">
                      ${agent.price}/mo
                    </div>
                    <div className="text-xs text-gray-500">
                      by {agent.creator}
                    </div>
                  </div>
                </PinterestCard>
              </motion.div>
            ))}
          </PinterestGrid>
        </motion.div>

        {/* Creator CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 glass-effect rounded-3xl p-12 text-center"
          id="create"
        >
          <h2 className="text-4xl font-bold mb-4">
            Become an AI Agent <span className="gradient-text">Creator</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join our creator economy. Build custom AI agents with our no-code builder,
            share them with thousands of users, and earn 70% revenue share.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-effect rounded-xl p-6">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-semibold mb-2">No-Code Builder</h3>
              <p className="text-sm text-gray-400">
                Create agents visually without writing code
              </p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-semibold mb-2">70% Revenue Share</h3>
              <p className="text-sm text-gray-400">
                Earn from every user subscription
              </p>
            </div>
            <div className="glass-effect rounded-xl p-6">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-sm text-gray-400">
                Track usage, earnings, and user feedback
              </p>
            </div>
          </div>
          <MaskButton variant="primary" href="/creator-signup" className="px-8 py-4 text-lg">
            Start Creating Agents
          </MaskButton>
        </motion.div>
      </div>
    </div>
  )
}
