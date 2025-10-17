import { motion } from 'framer-motion';
import Card from '../components/Card';
import { leadershipHierarchy } from '../data/leadership';

export default function Leadership() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-island-gradient">
          Leadership Structure
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Meet the dedicated leadership team guiding the Islanders to success on and off the field.
        </p>
      </div>

      {/* Leadership Grid */}
      <div className="max-w-4xl mx-auto space-y-6">
        {leadershipHierarchy
          .sort((a, b) => a.order - b.order)
          .map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-island-blue-400 to-cricket-green-400 flex items-center justify-center text-4xl md:text-5xl shadow-lg">
                      {member.emoji}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                      {member.name}
                    </h2>
                    <p className="text-lg font-semibold text-island-blue-600 dark:text-island-blue-400 mb-3">
                      {member.title}
                    </p>
                    {member.bio && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {member.bio}
                      </p>
                    )}
                  </div>

                  {/* Order Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-texas-gold-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      #{member.order}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
      </div>

      {/* Team Values */}
      <div className="mt-12">
        <Card className="p-8 bg-gradient-to-br from-island-blue-500 to-cricket-green-500 text-white text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">
            Leading with Vision & Passion
          </h2>
          <p className="text-lg max-w-2xl mx-auto">
            Our leadership team brings together experience, dedication, and strategic vision to guide the Islanders toward excellence in every aspect of the game.
          </p>
        </Card>
      </div>
    </div>
  );
}
