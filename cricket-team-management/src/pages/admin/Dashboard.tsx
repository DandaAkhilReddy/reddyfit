import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Activity,
  DollarSign,
  LayoutDashboard,
  Clock,
  Trophy,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
// import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
// import { db } from '../../lib/firebase';

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
      color: 'soft-blue',
      description: 'Schedule a new match'
    },
    {
      name: 'Add Practice',
      path: '/admin/practice/add',
      icon: Activity,
      color: 'soft-orange',
      description: 'Plan practice session'
    },
    {
      name: 'Add Player',
      path: '/admin/players/add',
      icon: Users,
      color: 'soft-blue',
      description: 'Register new player'
    },
    {
      name: 'Add Expense',
      path: '/admin/budget/add',
      icon: DollarSign,
      color: 'soft-orange',
      description: 'Record an expense'
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-soft-blue-200 border-t-soft-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const budgetRemaining = stats.totalBudget - stats.budgetSpent;
  const budgetPercentage = ((stats.budgetSpent / stats.totalBudget) * 100).toFixed(1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-soft-orange-100">
            <LayoutDashboard className="w-6 h-6 text-soft-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back! Here's your team overview</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Players"
            value={stats.totalPlayers}
            subtitle={`${stats.activePlayers} active`}
            icon={Users}
            color="soft-blue"
          />
          <StatCard
            title="Upcoming Matches"
            value={stats.upcomingMatches}
            subtitle="Scheduled"
            icon={Calendar}
            color="soft-orange"
          />
          <StatCard
            title="Recent Practices"
            value={stats.recentPractices}
            subtitle="Last 5 logged"
            icon={Activity}
            color="soft-blue"
          />
          <StatCard
            title="Budget Remaining"
            value={`$${budgetRemaining.toLocaleString()}`}
            subtitle={`${budgetPercentage}% spent`}
            icon={DollarSign}
            color="soft-orange"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              // Explicit color mapping for Tailwind JIT
              const colorClasses = action.color === 'soft-blue' ? {
                bg: 'bg-soft-blue-100',
                text: 'text-soft-blue-600'
              } : {
                bg: 'bg-soft-orange-100',
                text: 'text-soft-orange-600'
              };
              return (
                <Link
                  key={action.name}
                  to={action.path}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-soft-blue-300 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-lg ${colorClasses.bg} mb-3 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colorClasses.text}`} />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1 group-hover:text-soft-blue-600">
                    {action.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-soft-blue-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-soft-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{getTimeAgo(activity.timestamp)}</p>
                    </div>
                    <Badge variant="default" size="sm">{activity.type}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Team Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Team Performance</h2>
              <Trophy className="w-5 h-5 text-soft-orange-500" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">Win Rate</span>
                  <span className="text-sm font-bold text-gray-900">0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">Attendance</span>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.activePlayers > 0 ? '100%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-soft-blue-500 h-2 rounded-full" style={{ width: stats.activePlayers > 0 ? '100%' : '0%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">Budget Usage</span>
                  <span className="text-sm font-bold text-gray-900">{budgetPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-soft-orange-500 h-2 rounded-full" style={{ width: `${budgetPercentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
