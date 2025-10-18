import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Plus, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../lib/firebase';
import type { Equipment as EquipmentType } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

export default function Equipment() {
  const [equipment, setEquipment] = useState<(EquipmentType & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  useEffect(() => {
    fetchEquipment();
  }, []);

  async function fetchEquipment() {
    try {
      setLoading(true);
      const equipmentSnapshot = await getDocs(collection(db, 'equipment'));
      const equipmentData = equipmentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as EquipmentType,
      }));
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalItems = equipment.length;
  const totalValue = equipment.reduce((sum, e) => sum + e.cost, 0);
  const needsReplacement = equipment.filter(e => e.condition === 'Needs Replacement').length;
  const categories = ['All', 'Bats', 'Balls', 'Protective Gear', 'Team Kit', 'Training Equipment', 'Other'];

  const filteredEquipment = categoryFilter === 'All'
    ? equipment
    : equipment.filter(e => e.category === categoryFilter);

  const conditionColors = {
    'Excellent': 'success',
    'Good': 'info',
    'Fair': 'warning',
    'Poor': 'error',
    'Needs Replacement': 'error',
  } as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-texas-gold-200 border-t-texas-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading equipment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-soft-blue-100">
          <Package className="w-6 h-6 text-soft-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Inventory</h1>
          <p className="text-sm text-gray-600">Track team equipment, assignments, and maintenance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Items" value={totalItems} subtitle="Equipment tracked" icon={Package} color="soft-blue" />
        <StatCard title="Total Value" value={`$${totalValue.toLocaleString()}`} subtitle="Inventory worth" icon={DollarSign} color="soft-orange" />
        <StatCard title="Needs Replacement" value={needsReplacement} subtitle="Items requiring attention" icon={AlertTriangle} color="soft-blue" />
        <StatCard title="In Good Condition" value={equipment.filter(e => e.condition === 'Excellent' || e.condition === 'Good').length} subtitle="Ready to use" icon={CheckCircle} color="soft-orange" />
      </div>

      {/* Category Filter */}
      <Card className="p-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2">Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                categoryFilter === cat
                  ? 'bg-texas-gold-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Equipment Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Equipment List</h2>
          <Link to="/admin/equipment/add">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Equipment
            </Button>
          </Link>
        </div>

        {filteredEquipment.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No Equipment Found"
            description={categoryFilter === 'All' ? "Start adding equipment to track your team's inventory!" : `No ${categoryFilter} found. Try a different category.`}
            action={categoryFilter === 'All' ? (
              <Link to="/admin/equipment/add">
                <Button variant="primary">Add Equipment</Button>
              </Link>
            ) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="p-6 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="default">{item.category}</Badge>
                    <Badge variant={conditionColors[item.condition]}>{item.condition}</Badge>
                  </div>

                  <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white mb-2">{item.name}</h3>

                  {item.brand && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Brand: {item.brand}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">${item.cost}</span>
                    </div>
                    {item.assignedTo && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Assigned:</span>
                        <Badge variant="info" size="sm">Player</Badge>
                      </div>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">{item.notes}</p>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
