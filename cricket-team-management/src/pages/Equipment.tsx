import { Package } from 'lucide-react';
import Card from '../components/Card';

export default function Equipment() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-island-gradient">
          Equipment Inventory
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Complete equipment tracking coming soon!
        </p>
      </div>

      <Card className="p-12 text-center">
        <Package className="w-24 h-24 mx-auto mb-6 text-texas-gold-500" />
        <h2 className="text-2xl font-bold mb-4">Equipment Page Under Construction</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          View and manage all team equipment, assignments, and maintenance records.
        </p>
      </Card>
    </div>
  );
}
