import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Trophy,
  TrendingUp,
  Play,
  Plus,
  Target,
  Activity,
} from 'lucide-react';
// import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
// import { db } from '../lib/firebase';
import type { Match } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import Timeline, { type TimelineItem } from '../components/Timeline';

export default function Matches() {
  const [matches, setMatches] = useState<(Match & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    try {
      setLoading(true);
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matchesData = matchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Match,
      }));
      setMatches(matchesData);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }

  const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'ongoing');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const wins = completedMatches.filter(m => m.result === 'won').length;
  const losses = completedMatches.filter(m => m.result === 'lost').length;
  const winRate = completedMatches.length > 0 ? (wins / completedMatches.length) * 100 : 0;

  function formatDate(date: Date | any) {
    if (date?.toDate) date = date.toDate();
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-island-blue-200 border-t-island-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-soft-blue-100">
          <Calendar className="w-6 h-6 text-soft-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
          <p className="text-sm text-gray-600">Track all team matches and results</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Matches"
          value={completedMatches.length}
          subtitle="Matches played"
          icon={Calendar}
          color="soft-blue"
        />
        <StatCard
          title="Wins"
          value={wins}
          subtitle={`${winRate.toFixed(1)}% win rate`}
          icon={Trophy}
          color="soft-orange"
        />
        <StatCard
          title="Losses"
          value={losses}
          subtitle={`${completedMatches.length - wins} total`}
          icon={Target}
          color="soft-blue"
        />
        <StatCard
          title="Upcoming"
          value={upcomingMatches.length}
          subtitle="Scheduled matches"
          icon={Activity}
          color="soft-orange"
        />
      </div>

      {/* Upcoming Matches */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            Upcoming Matches
          </h2>
          <Link to="/admin/matches/add">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Schedule Match
            </Button>
          </Link>
        </div>

        {upcomingMatches.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Upcoming Matches"
            description="No matches are currently scheduled. Schedule your next match to get started!"
            action={
              <Link to="/admin/matches/add">
                <Button variant="primary">Schedule Match</Button>
              </Link>
            }
          />
        ) : (
          <Card className="p-6">
            <Timeline
              items={upcomingMatches.map(match => ({
                id: match.id,
                title: `Islanders vs ${match.opponent}`,
                subtitle: match.location,
                date: formatDate(match.date),
                time: match.time,
                status: match.status === 'ongoing' ? 'ongoing' : 'upcoming',
                content: (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">{match.type}</Badge>
                    {match.status === 'ongoing' && (
                      <Link to={`/live/${match.id}`}>
                        <Badge variant="error" className="animate-pulse cursor-pointer">
                          <Play className="w-3 h-3 inline mr-1" />
                          LIVE
                        </Badge>
                      </Link>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>
        )}
      </div>

      {/* Recent Results */}
      {completedMatches.length > 0 && (
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-6">
            Recent Results
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedMatches.slice(0, 6).map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-xl transition-shadow">
                  {/* Result Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <Badge
                      variant={
                        match.result === 'won'
                          ? 'success'
                          : match.result === 'lost'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      {match.result?.toUpperCase()}
                    </Badge>
                    <Badge variant="default">{match.type}</Badge>
                  </div>

                  {/* Match Details */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                      Islanders
                    </h3>
                    <div className="text-3xl font-bold text-island-blue-600 dark:text-island-blue-400 mb-2">
                      vs
                    </div>
                    <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                      {match.opponent}
                    </h3>
                  </div>

                  {/* Score */}
                  {match.ourScore && match.opponentScore && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4 text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Final Score</div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {match.ourScore} - {match.opponentScore}
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(match.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {match.location}
                    </div>
                  </div>

                  {/* Player of the Match */}
                  {match.playerOfTheMatch && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-texas-gold-500" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Player of the Match
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
