'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SlideContainer } from '@/components/transitions/SlideTransition'
import MaskButton from '@/components/transitions/MaskButton'
import { Activity, Heart, TrendingUp, Users, Calendar, Target } from 'lucide-react'

type TabId = 'overview' | 'workouts' | 'analytics' | 'community'

interface Tab {
  id: TabId
  name: string
  icon: any
}

const tabs: Tab[] = [
  { id: 'overview', name: 'Overview', icon: Activity },
  { id: 'workouts', name: 'Workouts', icon: Calendar },
  { id: 'analytics', name: 'Analytics', icon: TrendingUp },
  { id: 'community', name: 'Community', icon: Users }
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Dashboard <span className="gradient-text">Preview</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Experience the power of ReddyFit with this interactive demo.
            Navigate between sections to see slide transitions in action.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {tabs.map((tab) => (
            <MaskButton
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className="px-6 py-3 flex items-center gap-2"
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </MaskButton>
          ))}
        </motion.div>

        {/* Content Area with Slide Transitions */}
        <div className="relative min-h-[600px]">
          <SlideContainer activeIndex={tabs.findIndex(t => t.id === activeTab)}>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'workouts' && <WorkoutsTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'community' && <CommunityTab />}
          </SlideContainer>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-xl text-gray-300 mb-6">
            Ready to start tracking your fitness?
          </p>
          <MaskButton variant="primary" href="/download" className="px-8 py-4 text-lg">
            Download ReddyFit
          </MaskButton>
        </motion.div>
      </div>
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Stats */}
        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500/20 rounded-lg p-2">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold">Today's Activity</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold gradient-text">2,847</div>
              <div className="text-sm text-gray-400">Calories Burned</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xl font-semibold">45 min</div>
                <div className="text-xs text-gray-400">Active Time</div>
              </div>
              <div>
                <div className="text-xl font-semibold">12.3 km</div>
                <div className="text-xs text-gray-400">Distance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Heart Rate */}
        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-500/20 rounded-lg p-2">
              <Heart className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold">Heart Rate</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold gradient-text">142 bpm</div>
              <div className="text-sm text-gray-400">Average</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xl font-semibold">62 bpm</div>
                <div className="text-xs text-gray-400">Resting</div>
              </div>
              <div>
                <div className="text-xl font-semibold">178 bpm</div>
                <div className="text-xs text-gray-400">Max</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Goal */}
        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-500/20 rounded-lg p-2">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">Weekly Goal</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold gradient-text">4/5</div>
              <div className="text-sm text-gray-400">Workouts Completed</div>
            </div>
            <div className="bg-white/5 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full" style={{ width: '80%' }} />
            </div>
            <div className="text-sm text-gray-400">80% to goal</div>
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="glass-effect rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-6">Recent Workouts</h3>
        <div className="space-y-4">
          {[
            { type: 'Running', duration: '45 min', calories: 520, time: '2 hours ago' },
            { type: 'Strength Training', duration: '60 min', calories: 380, time: 'Yesterday' },
            { type: 'Cycling', duration: '30 min', calories: 290, time: '2 days ago' }
          ].map((workout, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-2xl">
                  {workout.type === 'Running' ? '🏃' : workout.type === 'Strength Training' ? '🏋️' : '🚴'}
                </div>
                <div>
                  <div className="font-semibold">{workout.type}</div>
                  <div className="text-sm text-gray-400">{workout.time}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{workout.duration}</div>
                <div className="text-sm text-gray-400">{workout.calories} cal</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WorkoutsTab() {
  return (
    <div className="space-y-6">
      <div className="glass-effect rounded-2xl p-6">
        <h3 className="text-2xl font-bold mb-6">Workout History</h3>
        <div className="space-y-4">
          {[
            { date: 'Today', workouts: [{ type: 'Morning Run', duration: '45 min', hr: '142 avg', zones: [5, 12, 18, 8, 2] }] },
            {
              date: 'Yesterday',
              workouts: [
                { type: 'Strength Training', duration: '60 min', hr: '128 avg', zones: [10, 25, 20, 5, 0] },
                { type: 'Evening Walk', duration: '30 min', hr: '98 avg', zones: [30, 0, 0, 0, 0] }
              ]
            },
            { date: '2 days ago', workouts: [{ type: 'Cycling', duration: '75 min', hr: '155 avg', zones: [5, 10, 30, 25, 5] }] }
          ].map((day, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4">
              <div className="text-sm text-gray-400 mb-3">{day.date}</div>
              {day.workouts.map((workout, j) => (
                <div key={j} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{workout.type}</div>
                    <div className="text-sm text-gray-400">{workout.duration}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-gray-400">
                      <Heart className="w-4 h-4 inline mr-1" />
                      {workout.hr}
                    </div>
                    <div className="flex gap-1 flex-1">
                      {workout.zones.map((width, k) => (
                        <div
                          key={k}
                          className="h-2 rounded-full"
                          style={{
                            width: `${width}%`,
                            backgroundColor: ['#3B82F6', '#10B981', '#FBBF24', '#F97316', '#EF4444'][k]
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <div className="glass-effect rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-6">Performance Trends</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Avg Weekly Calories</span>
                <span className="text-green-400 text-sm">+12%</span>
              </div>
              <div className="bg-white/5 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full" style={{ width: '75%' }} />
              </div>
              <div className="text-2xl font-bold mt-2">2,450 cal</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Workout Frequency</span>
                <span className="text-green-400 text-sm">+8%</span>
              </div>
              <div className="bg-white/5 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full" style={{ width: '85%' }} />
              </div>
              <div className="text-2xl font-bold mt-2">4.5x/week</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Recovery Score</span>
                <span className="text-yellow-400 text-sm">-3%</span>
              </div>
              <div className="bg-white/5 rounded-full h-2">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full" style={{ width: '62%' }} />
              </div>
              <div className="text-2xl font-bold mt-2">62%</div>
            </div>
          </div>
        </div>

        {/* Heart Rate Zones */}
        <div className="glass-effect rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-6">Heart Rate Distribution</h3>
          <div className="space-y-3">
            {[
              { zone: 'Zone 1', percent: 25, color: '#3B82F6', label: 'Recovery' },
              { zone: 'Zone 2', percent: 35, color: '#10B981', label: 'Aerobic' },
              { zone: 'Zone 3', percent: 20, color: '#FBBF24', label: 'Tempo' },
              { zone: 'Zone 4', percent: 15, color: '#F97316', label: 'Threshold' },
              { zone: 'Zone 5', percent: 5, color: '#EF4444', label: 'VO2 Max' }
            ].map((zone, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-gray-400">{zone.zone} - {zone.label}</span>
                  <span className="font-semibold">{zone.percent}%</span>
                </div>
                <div className="bg-white/5 rounded-full h-2">
                  <div className="h-full rounded-full" style={{ width: `${zone.percent}%`, backgroundColor: zone.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="glass-effect rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4">AI Insights</h3>
        <div className="space-y-3">
          {[
            { icon: '🎯', text: 'You\'re on track to hit your weekly goal! One more workout to go.' },
            { icon: '💤', text: 'Your recovery score is lower than usual. Consider an easy day or rest.' },
            { icon: '🔥', text: 'Great consistency! You\'ve worked out 4 days in a row.' },
            { icon: '📈', text: 'Your average heart rate during runs has decreased by 5 bpm - improved fitness!' }
          ].map((insight, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-2xl">{insight.icon}</span>
              <p className="text-gray-300 flex-1">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CommunityTab() {
  return (
    <div className="space-y-6">
      {/* Leaderboard */}
      <div className="glass-effect rounded-2xl p-6">
        <h3 className="text-2xl font-bold mb-6">Weekly Leaderboard</h3>
        <div className="space-y-3">
          {[
            { rank: 1, name: 'Sarah Chen', workouts: 7, calories: 3250, badge: '🥇' },
            { rank: 2, name: 'Mike Torres', workouts: 6, calories: 2980, badge: '🥈' },
            { rank: 3, name: 'You', workouts: 5, calories: 2450, badge: '🥉', highlight: true },
            { rank: 4, name: 'Lisa Park', workouts: 5, calories: 2320, badge: '' },
            { rank: 5, name: 'James Wilson', workouts: 4, calories: 2100, badge: '' }
          ].map((user) => (
            <div
              key={user.rank}
              className={`flex items-center justify-between p-4 rounded-xl ${
                user.highlight ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-purple-500/50' : 'bg-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{user.badge || `#${user.rank}`}</div>
                <div>
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-gray-400">{user.workouts} workouts</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold gradient-text">{user.calories}</div>
                <div className="text-xs text-gray-400">calories</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-effect rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-6">Community Activity</h3>
        <div className="space-y-4">
          {[
            { user: 'Sarah Chen', action: 'completed a 10k run', time: '15 min ago', likes: 12 },
            { user: 'Mike Torres', action: 'hit a new PR in bench press', time: '1 hour ago', likes: 24 },
            { user: 'Lisa Park', action: 'started using Vegan Meal Planner AI', time: '2 hours ago', likes: 8 },
            { user: 'James Wilson', action: 'joined the Marathon Training challenge', time: '3 hours ago', likes: 15 }
          ].map((activity, i) => (
            <div key={i} className="flex items-start gap-4 p-3 bg-white/5 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold">
                {activity.user[0]}
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-semibold">{activity.user}</span> {activity.action}
                </div>
                <div className="text-xs text-gray-400 mt-1">{activity.time}</div>
              </div>
              <div className="text-sm text-gray-400">❤️ {activity.likes}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
