import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Trophy, Award } from 'lucide-react';
import Card from '../components/Card';
import { initialPlayers } from '../data/players';
import type { PlayerRole } from '../types';

export default function Squad() {
  const [filter, setFilter] = useState<PlayerRole | 'All'>('All');

  const roles: Array<PlayerRole | 'All'> = ['All', 'Batsman', 'Allrounder', 'Bowler', 'WK-Batsman'];

  const filteredPlayers =
    filter === 'All' ? initialPlayers : initialPlayers.filter((p) => p.role === filter);

  const getPositionBadge = (position: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      Principal: { bg: 'bg-texas-gold-100 text-texas-gold-800', text: 'Principal', icon: Trophy },
      Director: { bg: 'bg-purple-100 text-purple-800', text: 'Director', icon: Award },
      Captain: { bg: 'bg-island-blue-100 text-island-blue-800', text: 'Captain', icon: Trophy },
      'Vice Captain': { bg: 'bg-cricket-green-100 text-cricket-green-800', text: 'VC', icon: Trophy },
      'Associate VC': { bg: 'bg-emerald-100 text-emerald-800', text: 'Assoc. VC', icon: Trophy },
      'Quality Director': { bg: 'bg-indigo-100 text-indigo-800', text: 'Quality Dir', icon: Award },
    };

    return badges[position] || null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-island-gradient">
          Our Squad
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Meet the 14 talented players who represent the Islanders Cricket Team with passion and dedication.
        </p>
      </div>

      {/* Filters */}
      <div className="flex justify-center flex-wrap gap-3">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === role
                ? 'bg-island-blue-500 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-island-blue-50 dark:hover:bg-gray-700'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Squad Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPlayers.map((player, index) => {
          const badge = getPositionBadge(player.position);
          const BadgeIcon = badge?.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Card hover className="p-6 relative">
                {/* Position Badge */}
                {badge && (
                  <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${badge.bg}`}>
                    {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                    <span>{badge.text}</span>
                  </div>
                )}

                {/* Player Avatar */}
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-island-blue-400 to-cricket-green-400 flex items-center justify-center">
                  {player.photo ? (
                    <img
                      src={player.photo}
                      alt={player.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>

                {/* Player Info */}
                <div className="text-center">
                  <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white mb-1">
                    {player.name}
                  </h3>
                  <p className="text-sm text-island-blue-600 dark:text-island-blue-400 font-semibold mb-2">
                    {player.role}
                  </p>
                  {player.battingHand && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {player.battingHand}-handed
                    </p>
                  )}
                  {player.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {player.bio}
                    </p>
                  )}
                </div>

                {/* Stats Preview */}
                <div className="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {player.stats.matchesPlayed}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Matches</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {player.attendanceRate}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Attendance</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No players found in this category.
          </p>
        </div>
      )}
    </div>
  );
}
