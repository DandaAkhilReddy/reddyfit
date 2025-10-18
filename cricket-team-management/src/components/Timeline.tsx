import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock } from 'lucide-react';

export interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  time?: string;
  status?: 'completed' | 'upcoming' | 'ongoing';
  icon?: ReactNode;
  content?: ReactNode;
  color?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export default function Timeline({ items, className = '' }: TimelineProps) {
  return (
    <div className={`relative ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const statusColors = {
          completed: 'bg-green-500 border-green-500',
          ongoing: 'bg-yellow-500 border-yellow-500',
          upcoming: 'bg-gray-300 dark:bg-gray-600 border-gray-300 dark:border-gray-600',
        };
        const statusColor = item.status ? statusColors[item.status] : statusColors.upcoming;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-4 pb-8"
          >
            {/* Timeline Line & Dot */}
            <div className="relative flex flex-col items-center">
              {/* Dot */}
              <div className={`w-4 h-4 rounded-full border-2 ${statusColor} z-10`}>
                {item.status === 'completed' && (
                  <div className="w-full h-full rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
                {item.status === 'ongoing' && (
                  <div className="w-full h-full rounded-full bg-yellow-500 flex items-center justify-center animate-pulse">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Vertical Line */}
              {!isLast && (
                <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 absolute top-4"></div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h4>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                  {item.date}
                </span>
              </div>

              {item.subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {item.subtitle}
                </p>
              )}

              {item.time && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mb-2">
                  <Clock className="w-3 h-3" />
                  {item.time}
                </div>
              )}

              {item.content && (
                <div className="mt-2">
                  {item.content}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
