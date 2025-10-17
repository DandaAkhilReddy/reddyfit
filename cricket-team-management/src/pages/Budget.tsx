import { DollarSign } from 'lucide-react';
import Card from '../components/Card';

export default function Budget() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-island-gradient">
          Budget & Finances
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Complete financial transparency coming soon!
        </p>
      </div>

      <Card className="p-12 text-center">
        <DollarSign className="w-24 h-24 mx-auto mb-6 text-island-blue-500" />
        <h2 className="text-2xl font-bold mb-4">Budget Page Under Construction</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Track all expenses, view budget breakdowns, and see how sponsor funds are utilized.
        </p>
      </Card>
    </div>
  );
}
