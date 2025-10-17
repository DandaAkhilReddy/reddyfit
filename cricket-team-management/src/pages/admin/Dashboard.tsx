import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  Activity,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Trophy,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activePlayers: 0,
    upcomingMatches: 0,
    recentPractices: 0,
    totalBudget: 50000,
    budgetSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);

      // Fetch players
      const playersSnapshot = await getDocs(collection(db, 'players'));
      const totalPlayers = playersSnapshot.size;
      const activePlayers = playersSnapshot.docs.filter(
        (doc) => doc.data().isActive
      ).length;

      // Fetch upcoming matches
      const matchesQuery = query(
        collection(db, 'matches'),
        where('status', '==', 'scheduled'),
        orderBy('date'),
        limit(10)
      );
      const matchesSnapshot = await getDocs(matchesQuery);

      // Fetch recent practices
      const practicesQuery = query(
        collection(db, 'practices'),
        orderBy('date', 'desc'),
        limit(5)
      );
      const practicesSnapshot = await getDocs(practicesQuery);

      // Fetch budget
      const expensesSnapshot = await getDocs(collection(db, 'expenses'));
      const budgetSpent = expensesSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().amount || 0),
        0
      );

      setStats({
        totalPlayers,
        activePlayers,
        upcomingMatches: matchesSnapshot.size,
        recentPractices: practicesSnapshot.size,
        totalBudget: 50000,
        budgetSpent,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentActivity() {
    // Simulated activity - in production, fetch from Firestore
    const activities = [
      {
        id: '1',
        type: 'player',
        action: 'added',
        description: 'New player joined the team',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      },
      {
        id: '2',
        type: 'match',
        action: 'scheduled',
        description: 'Upcoming match vs Warriors',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        id: '3',
        type: 'practice',
        action: 'completed',
        description: 'Batting practice session',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      },
    ];
    setRecentActivity(activities);
  }

  function getTimeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  const quickActions = [
    {
      name: 'Add Match',
      path: '/admin/matches/add',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      description: 'Schedule a new match'
    },
    {
      name: 'Add Practice',
      path: '/admin/practice/add',
      icon: Activity,
      color: 'from-green-500 to-green-600',
      description: 'Plan practice session'
    },
    {
      name: 'Add Player',
      path: '/admin/players/add',
      icon: Users,
      color: 'from-yellow-500 to-yellow-600',
      description: 'Register new player'
    },
    {
      name: 'Add Expense',
      path: '/admin/budget/add',
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      description: 'Record an expense'
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-island-blue-200 border-t-island-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const budgetRemaining = stats.totalBudget - stats.budgetSpent;
  const budgetPercentage = ((stats.budgetSpent / stats.totalBudget) * 100).toFixed(1);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with the Islanders today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Players"
            value={stats.totalPlayers}
            subtitle={`${stats.activePlayers} active players`}
            icon={Users}
            color="from-island-blue-500 to-island-blue-600"
            delay={0}
          />
          <StatCard
            title="Upcoming Matches"
            value={stats.upcomingMatches}
            subtitle="Scheduled this month"
            icon={Calendar}
            color="from-cricket-green-500 to-cricket-green-600"
            delay={0.1}
          />
          <StatCard
            title="Recent Practices"
            value={stats.recentPractices}
            subtitle="Last 5 sessions logged"
            icon={Activity}
            color="from-texas-gold-500 to-texas-gold-600"
            delay={0.2}
          />
          <StatCard
            title="Budget Remaining"
            value={`$${budgetRemaining.toLocaleString()}`}
            subtitle={`${budgetPercentage}% spent`}
            icon={DollarSign}
            color="from-purple-500 to-purple-600"
            delay={0.3}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={action.path}>
                    <Card hover className="p-6 group">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} mb-4 flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-island-blue-600 dark:group-hover:text-island-blue-400 transition-colors">
                        {action.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {action.description}
                      </p>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <Link to="/admin/activity" className="text-sm text-island-blue-600 dark:text-island-blue-400 hover:underline flex items-center gap-1">
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-island-blue-100 dark:bg-island-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-island-blue-600 dark:text-island-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    <Badge variant="default" size="sm">
                      {activity.type}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                  <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </Card>

          {/* Team Performance */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                Team Performance
              </h2>
              <Trophy className="w-6 h-6 text-texas-gold-500" />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Win Rate
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    0%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                    style={{ width: '0%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Attendance Rate
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {stats.activePlayers > 0 ? '100%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-island-blue-500 to-island-blue-600 h-2 rounded-full transition-all"
                    style={{ width: stats.activePlayers > 0 ? '100%' : '0%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Budget Usage
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {budgetPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${budgetPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-island-blue-50 to-cricket-green-50 dark:from-island-blue-900/20 dark:to-cricket-green-900/20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong className="font-semibold">Pro Tip:</strong> Start adding match results and practice sessions to see your team's performance metrics come to life!
              </p>
            </div>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="p-6 bg-gradient-to-br from-island-blue-500 to-cricket-green-500">
          <div className="text-white">
            <h2 className="text-2xl font-heading font-bold mb-2">
              Get Started with Your Team
            </h2>
            <p className="text-white/90 mb-6">
              Complete these steps to fully set up your team management system
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Add Your Players</h3>
                <p className="text-sm text-white/80">Import your 14 team members</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Schedule Matches</h3>
                <p className="text-sm text-white/80">Plan your upcoming games</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Track Progress</h3>
                <p className="text-sm text-white/80">Monitor team performance</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
