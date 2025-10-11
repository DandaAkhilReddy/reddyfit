'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Download, RefreshCw, Mail, Calendar, Trophy, TrendingUp, Award } from 'lucide-react'
import MaskButton from '@/components/transitions/MaskButton'

interface WaitlistUser {
  id: string
  name: string
  email: string
  photoUrl: string
  tier: string
  position?: number
  referralCode?: string
  referralCount?: number
  signupDate: string
  notified: boolean
}

interface Analytics {
  totalUsers: number
  tierBreakdown: Record<string, number>
  totalReferrals: number
  avgReferralsPerUser: number
  topReferrers: Array<{
    name: string
    email: string
    referralCount: number
    position: number
  }>
}

export default function AdminWaitlistPage() {
  const [users, setUsers] = useState<WaitlistUser[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsers = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/waitlist')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load waitlist users')
      }

      setUsers(data.users)
      setAnalytics(data.analytics)
    } catch (err: any) {
      setError(err.message || 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const exportToCSV = () => {
    const headers = ['Position', 'Name', 'Email', 'Tier', 'Referral Code', 'Referrals', 'Signup Date', 'Notified']
    const rows = users.map((user) => [
      user.position || 'N/A',
      user.name,
      user.email,
      user.tier,
      user.referralCode || 'N/A',
      user.referralCount || 0,
      new Date(user.signupDate).toLocaleDateString(),
      user.notified ? 'Yes' : 'No',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reddyfit-waitlist-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Waitlist <span className="gradient-text">Dashboard</span>
                </h1>
                <p className="text-gray-400">Manage your early access signups with smart positioning</p>
              </div>

              <div className="flex gap-3">
                <MaskButton
                  variant="ghost"
                  onClick={loadUsers}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </MaskButton>
                <MaskButton
                  variant="primary"
                  onClick={() => users.length > 0 && exportToCSV()}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </MaskButton>
              </div>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Total Users</span>
                </div>
                <div className="text-3xl font-bold gradient-text">{analytics?.totalUsers || 0}</div>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">Total Referrals</span>
                </div>
                <div className="text-3xl font-bold gradient-text">{analytics?.totalReferrals || 0}</div>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-gray-400">Avg Referrals/User</span>
                </div>
                <div className="text-3xl font-bold gradient-text">{analytics?.avgReferralsPerUser || 0}</div>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-gray-400">Top Referrer</span>
                </div>
                <div className="text-3xl font-bold gradient-text">
                  {analytics?.topReferrers[0]?.referralCount || 0}
                </div>
              </div>
            </div>

            {/* Tier Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['Starter', 'Pro', 'Elite', 'Platinum'].map((tier) => (
                <div key={tier} className="glass-effect rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">{tier}</span>
                  </div>
                  <div className="text-2xl font-bold gradient-text">
                    {analytics?.tierBreakdown[tier.toLowerCase()] || 0}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Referrers Section */}
          {analytics && analytics.topReferrers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-effect rounded-2xl p-6 mb-6"
            >
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Top 10 Referrers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.topReferrers.map((referrer, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                      ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600' : ''}
                      ${index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : ''}
                      ${index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : ''}
                      ${index > 2 ? 'bg-gradient-to-br from-purple-500 to-purple-700' : ''}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{referrer.name}</div>
                      <div className="text-sm text-gray-400">{referrer.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">{referrer.referralCount}</div>
                      <div className="text-xs text-gray-400">referrals</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-400">#{referrer.position}</div>
                      <div className="text-xs text-gray-400">position</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400"
            >
              {error}
            </motion.div>
          )}

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-2xl overflow-hidden"
          >
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-gray-600 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading waitlist...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No users yet</h3>
                <p className="text-gray-400">Waitlist signups will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">Position</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">User</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">Email</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">Tier</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">Referrals</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">Signup Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {user.position && user.position <= 50 ? (
                              <Trophy className="w-5 h-5 text-yellow-400" />
                            ) : user.position && user.position <= 100 ? (
                              <Award className="w-5 h-5 text-blue-400" />
                            ) : null}
                            <span className="text-2xl font-bold gradient-text">
                              #{user.position || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {user.photoUrl && (
                              <img
                                src={user.photoUrl}
                                alt={user.name}
                                className="w-10 h-10 rounded-full"
                              />
                            )}
                            <div>
                              <div className="font-semibold">{user.name}</div>
                              {user.referralCode && (
                                <div className="text-xs text-gray-500 font-mono">{user.referralCode}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                            user.tier === 'platinum' ? 'bg-yellow-500/20 text-yellow-300' :
                            user.tier === 'elite' ? 'bg-purple-500/20 text-purple-300' :
                            user.tier === 'pro' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {user.tier}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="font-bold text-green-400">{user.referralCount || 0}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-400 text-sm">
                          {new Date(user.signupDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center text-sm text-gray-500"
          >
            <p>
              Data updates in real-time from Firebase Firestore.
              <br />
              Users are sorted by position (ascending). Referrals boost position by 10 spots each.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
