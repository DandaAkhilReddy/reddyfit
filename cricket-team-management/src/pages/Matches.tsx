import { Calendar } from 'lucide-react';
import Card from '../components/Card';

export default function Matches() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-island-gradient">
          Matches
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Match calendar and results coming soon!
        </p>
      </div>

      <Card className="p-12 text-center">
        <Calendar className="w-24 h-24 mx-auto mb-6 text-island-blue-500" />
        <h2 className="text-2xl font-bold mb-4">Matches Page Under Construction</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          We're building an amazing match management system where you'll be able to view schedules, scorecards, and match highlights.
        </p>
      </Card>
    </div>
  );
}
