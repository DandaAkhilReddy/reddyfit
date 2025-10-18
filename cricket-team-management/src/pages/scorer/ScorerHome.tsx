import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Calendar, MapPin, Clock, TrendingUp } from 'lucide-react';
// import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
// import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { Match } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

export default function ScorerHome() {
  const { currentUser, isScorer } = useAuth();
  const [matches, setMatches] = useState<(Match & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    try {
      setLoading(true);

      // Fetch scheduled and ongoing matches
      const matchesQuery = query(
        collection(db, 'matches'),
        where('status', 'in', ['scheduled', 'ongoing']),
        orderBy('date', 'asc')
      );

      const matchesSnapshot = await getDocs(matchesQuery);
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

  function formatDate(date: Date | any) {
    if (date?.toDate) {
      date = date.toDate();
    }
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  if (!isScorer) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-island-blue-200 border-t-island-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-island-blue-500 to-cricket-green-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">
                Live Scoring
              </h1>
              <p className="text-white/90">
                Welcome, {currentUser?.displayName} 👋
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80">Scorer Dashboard</div>
              <Badge variant="success" className="mt-2">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Ready to Score
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Scheduled Matches */}
        <div className="mb-8">
          <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            Upcoming Matches
          </h2>

          {matches.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No matches scheduled
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back later for upcoming matches to score
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-xl transition-shadow relative overflow-hidden">
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <Badge variant={match.status === 'ongoing' ? 'success' : 'info'}>
                        {match.status === 'ongoing' ? 'LIVE' : 'Scheduled'}
                      </Badge>
                    </div>

                    {/* Match Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                        Islanders
                      </h3>
                      <div className="text-2xl font-bold text-island-blue-600 dark:text-island-blue-400 mb-2">
                        vs
                      </div>
                      <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                        {match.opponent}
                      </h3>
                    </div>

                    {/* Match Details */}
                    <div className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(match.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {match.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {match.location}
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div className="mb-4">
                      <Badge variant="default">{match.type}</Badge>
                    </div>

                    {/* Start Scoring Button */}
                    <Link to={`/scorer/match/${match.id}`}>
                      <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                        <Play className="w-5 h-5" />
                        {match.status === 'ongoing' ? 'Continue Scoring' : 'Start Scoring'}
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Guide */}
        <Card className="p-6 bg-gradient-to-br from-island-blue-50 to-cricket-green-50 dark:from-island-blue-900/20 dark:to-cricket-green-900/20 border-2 border-island-blue-200 dark:border-island-blue-700">
          <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white mb-3">
            Scorer Quick Guide 📊
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-island-blue-600 dark:text-island-blue-400 font-bold">1.</span>
              <span>Select a match above to start scoring</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-island-blue-600 dark:text-island-blue-400 font-bold">2.</span>
              <span>Enter toss details and playing XI before starting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-island-blue-600 dark:text-island-blue-400 font-bold">3.</span>
              <span>Use the scoring panel to record each ball</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-island-blue-600 dark:text-island-blue-400 font-bold">4.</span>
              <span>Scores update in real-time for all viewers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-island-blue-600 dark:text-island-blue-400 font-bold">5.</span>
              <span>You can undo the last ball if needed</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
