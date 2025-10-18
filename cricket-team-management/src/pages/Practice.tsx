import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Users, Clock, Plus, TrendingUp, Calendar } from 'lucide-react';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../lib/firebase';
import type { Practice as PracticeType } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import ProgressRing from '../components/ProgressRing';
import Timeline from '../components/Timeline';

export default function Practice() {
  const [practices, setPractices] = useState<(PracticeType & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPractices();
  }, []);

  async function fetchPractices() {
    try {
      setLoading(true);
      const practicesSnapshot = await getDocs(collection(db, 'practices'));
      const practicesData = practicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as PracticeType,
      }));
      setPractices(practicesData);
    } catch (error) {
      console.error('Error fetching practices:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalSessions = practices.length;
  const totalAttendance = practices.reduce((sum, p) => sum + p.attendance.length, 0);
  const avgAttendance = totalSessions > 0 ? Math.round((totalAttendance / totalSessions)) : 0;
  const attendanceRate = totalSessions > 0 ? (totalAttendance / (totalSessions * 14)) * 100 : 0;

  function formatDate(date: Date | any) {
    if (date?.toDate) date = date.toDate();
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const practiceTypeColors: Record<string, string> = {
    'Batting': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Bowling': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Fielding': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Fitness': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Full Practice': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cricket-green-200 border-t-cricket-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading practices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-soft-orange-100">
          <Activity className="w-6 h-6 text-soft-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice Schedule</h1>
          <p className="text-sm text-gray-600">Track practice sessions, attendance, and team development</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sessions"
          value={totalSessions}
          subtitle="Practices completed"
          icon={Activity}
          color="soft-orange"
        />
        <StatCard
          title="Avg Attendance"
          value={avgAttendance}
          subtitle="Players per session"
          icon={Users}
          color="soft-blue"
        />
        <StatCard
          title="Attendance Rate"
          value={`${attendanceRate.toFixed(0)}%`}
          subtitle="Overall participation"
          icon={TrendingUp}
          color="soft-orange"
        />
        <StatCard
          title="Next Practice"
          value="TBD"
          subtitle="Schedule upcoming"
          icon={Calendar}
          color="soft-blue"
        />
      </div>

      {/* Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Overall Attendance
          </h3>
          <div className="flex justify-center">
            <ProgressRing
              progress={attendanceRate}
              size={140}
              strokeWidth={12}
              color="#228B22"
              showPercentage
            />
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Practice Types Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['Batting', 'Bowling', 'Fielding', 'Fitness', 'Full Practice'].map((type) => {
              const count = practices.filter(p => p.type === type).length;
              return (
                <div key={type} className="text-center">
                  <div className={`text-2xl font-bold text-gray-900 dark:text-white mb-1`}>
                    {count}
                  </div>
                  <Badge variant="default" size="sm" className={practiceTypeColors[type]}>
                    {type}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Practice Sessions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            Recent Practice Sessions
          </h2>
          <Link to="/admin/practice/add">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Log Practice
            </Button>
          </Link>
        </div>

        {practices.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No Practice Sessions"
            description="Start logging practice sessions to track team development and attendance!"
            action={
              <Link to="/admin/practice/add">
                <Button variant="primary">Log First Practice</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {practices.slice(0, 6).map((practice, index) => (
              <motion.div
                key={practice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="default" className={practiceTypeColors[practice.type]}>
                      {practice.type}
                    </Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(practice.date)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span>{practice.time} • {practice.duration} minutes</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Users className="w-4 h-4" />
                      <span>{practice.attendance.length}/14 players attended</span>
                    </div>

                    {practice.focusAreas && practice.focusAreas.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Focus Areas:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {practice.focusAreas.map((area, idx) => (
                            <Badge key={idx} variant="default" size="sm">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {practice.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {practice.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {practice.location}
                      </span>
                      <div className="text-sm font-semibold text-cricket-green-600 dark:text-cricket-green-400">
                        {Math.round((practice.attendance.length / 14) * 100)}% attendance
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
