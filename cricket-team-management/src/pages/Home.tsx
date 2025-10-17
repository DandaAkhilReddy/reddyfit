import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, TrendingUp, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';

export default function Home() {
  const stats = [
    { label: 'Squad Members', value: '14', icon: Users, color: 'from-island-blue-500 to-island-blue-600' },
    { label: 'Matches Played', value: '0', icon: Calendar, color: 'from-cricket-green-500 to-cricket-green-600' },
    { label: 'Win Rate', value: '-', icon: TrendingUp, color: 'from-texas-gold-500 to-texas-gold-600' },
    { label: 'Team Spirit', value: '100%', icon: Heart, color: 'from-pink-500 to-red-600' },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 island-gradient opacity-90"></div>
        <div className="hero-overlay"></div>

        <div className="relative z-10 px-8 py-16 md:py-24 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Trophy className="w-20 h-20 mx-auto mb-6" />
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-4">
              Islanders Cricket Team
            </h1>
            <p className="text-2xl md:text-3xl font-semibold mb-6">
              Islanders by name, Islanders by spirit 💙
            </p>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              From the shores of Corpus Christi, Texas - The only island-based cricket team bringing passion, energy, and cricketing spirit to Texas!
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link to="/squad">
                <Button size="lg" variant="gold">
                  Meet the Squad
                </Button>
              </Link>
              <Link to="/matches">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  View Matches
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sponsor Section */}
      <section>
        <Card className="p-8 bg-gradient-to-r from-texas-gold-50 to-texas-gold-100 dark:from-texas-gold-900/20 dark:to-texas-gold-800/20 border-2 border-texas-gold-300">
          <div className="text-center">
            <p className="text-sm font-semibold text-texas-gold-800 dark:text-texas-gold-400 uppercase tracking-wider mb-2">
              Official Sponsors
            </p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-3">
              Dr. Vishnu Reddy & Dr. Veena Reddy
            </h2>
            <p className="text-xl font-semibold text-texas-gold-700 dark:text-texas-gold-300 mb-4">
              HHA Medicine
            </p>
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              We are immensely grateful for the generous sponsorship and unwavering support that makes our journey possible. Every practice, every match, and every victory is made possible by this incredible partnership.
            </p>
          </div>
        </Card>
      </section>

      {/* Stats Grid */}
      <section>
        <h2 className="text-3xl font-heading font-bold text-center mb-8">Team Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Card className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Call to Action */}
      <section>
        <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-island-blue-500 to-cricket-green-500 text-white">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            This is just the beginning ⚡️
          </h2>
          <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto">
            From practice sessions to match-day battles, every update, every highlight, and every victory will be shared right here. Follow us, support us, and join our journey!
          </p>
          <Link to="/communications">
            <Button size="lg" variant="gold">
              Join the Conversation
            </Button>
          </Link>
        </Card>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-3xl font-heading font-bold text-center mb-8">Explore More</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/leadership">
            <Card hover className="p-6">
              <Trophy className="w-12 h-12 text-texas-gold-500 mb-4" />
              <h3 className="text-xl font-heading font-bold mb-2">Leadership</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Meet our leadership team guiding the Islanders to success
              </p>
            </Card>
          </Link>

          <Link to="/equipment">
            <Card hover className="p-6">
              <Users className="w-12 h-12 text-island-blue-500 mb-4" />
              <h3 className="text-xl font-heading font-bold mb-2">Equipment</h3>
              <p className="text-gray-600 dark:text-gray-400">
                View our complete inventory and equipment tracking
              </p>
            </Card>
          </Link>

          <Link to="/budget">
            <Card hover className="p-6">
              <TrendingUp className="w-12 h-12 text-cricket-green-500 mb-4" />
              <h3 className="text-xl font-heading font-bold mb-2">Budget</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Complete financial transparency - see where every dollar goes
              </p>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
