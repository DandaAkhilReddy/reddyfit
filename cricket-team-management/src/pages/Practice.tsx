import { Activity } from 'lucide-react';
import Card from '../components/Card';

export default function Practice() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-island-gradient">
          Practice Schedule
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Practice sessions and attendance tracking coming soon!
        </p>
      </div>

      <Card className="p-12 text-center">
        <Activity className="w-24 h-24 mx-auto mb-6 text-cricket-green-500" />
        <h2 className="text-2xl font-bold mb-4">Practice Page Under Construction</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Track practice sessions, mark your availability, and view attendance records.
        </p>
      </Card>
    </div>
  );
}
