import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Pin, Users, Bell, MessageCircle, Send } from 'lucide-react';
// import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
// import { db } from '../lib/firebase';
import type { Announcement } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';

export default function Communications() {
  const [announcements, setAnnouncements] = useState<(Announcement & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      setLoading(true);
      const announcementsSnapshot = await getDocs(
        query(collection(db, 'announcements'), orderBy('date', 'desc'), limit(20))
      );
      const announcementsData = announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Announcement,
      }));
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  }

  const pinnedAnnouncements = announcements.filter(a => a.isPinned);
  const regularAnnouncements = announcements.filter(a => !a.isPinned);
  const totalMessages = announcements.length;
  const thisWeek = announcements.filter(a => {
    const date = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }).length;

  function formatDate(date: Date | any) {
    if (date?.toDate) date = date.toDate();
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      'General': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'Match': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'Practice': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'Event': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'Important': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[category] || colors['General'];
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-island-blue-200 border-t-island-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading communications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-soft-blue-100">
          <MessageSquare className="w-6 h-6 text-soft-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications Hub</h1>
          <p className="text-sm text-gray-600">Stay connected with team announcements and updates</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Messages" value={totalMessages} subtitle="All announcements" icon={MessageCircle} color="soft-blue" />
        <StatCard title="This Week" value={thisWeek} subtitle="Recent updates" icon={Bell} color="soft-orange" />
        <StatCard title="Pinned" value={pinnedAnnouncements.length} subtitle="Important posts" icon={Pin} color="soft-blue" />
        <StatCard title="Active Users" value={14} subtitle="Team members" icon={Users} color="soft-orange" />
      </div>

      {/* New Announcement Button */}
      <div className="flex justify-end">
        <Link to="/admin/communications/add">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Announcement
          </Button>
        </Link>
      </div>

      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Pin className="w-5 h-5 text-texas-gold-500" />
            <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Pinned Announcements</h2>
          </div>
          <div className="space-y-4">
            {pinnedAnnouncements.map((announcement, index) => (
              <motion.div key={announcement.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="p-6 border-2 border-texas-gold-200 dark:border-texas-gold-800 bg-texas-gold-50/30 dark:bg-texas-gold-900/10">
                  <div className="flex items-start gap-4">
                    <Avatar name={announcement.author} size="lg" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white">{announcement.title}</h3>
                            <Badge variant="default" size="sm" className={getCategoryColor(announcement.category)}>{announcement.category}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{announcement.author}</span>
                            <span>•</span>
                            <span>{formatDate(announcement.date)}</span>
                          </div>
                        </div>
                        <Badge variant="warning" size="sm" className="flex items-center gap-1">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </Badge>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{announcement.message}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Announcements */}
      <div>
        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-6">Recent Announcements</h2>

        {regularAnnouncements.length === 0 && pinnedAnnouncements.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No Announcements Yet" description="Post your first team announcement to get started!" action={
            <Link to="/admin/communications/add"><Button variant="primary">Post Announcement</Button></Link>
          } />
        ) : regularAnnouncements.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">No other announcements</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {regularAnnouncements.map((announcement, index) => (
              <motion.div key={announcement.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-4">
                    <Avatar name={announcement.author} size="lg" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white">{announcement.title}</h3>
                            <Badge variant="default" size="sm" className={getCategoryColor(announcement.category)}>{announcement.category}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{announcement.author}</span>
                            <span>•</span>
                            <span>{formatDate(announcement.date)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{announcement.message}</p>
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
