import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Plus, TrendingDown, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../lib/firebase';
import type { Expense } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import ProgressRing from '../components/ProgressRing';

export default function Budget() {
  const [expenses, setExpenses] = useState<(Expense & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const totalBudget = 50000;

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const expensesSnapshot = await getDocs(collection(db, 'expenses'));
      const expensesData = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Expense,
      }));
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalBudget - totalSpent;
  const spentPercentage = (totalSpent / totalBudget) * 100;

  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  function formatDate(date: Date | any) {
    if (date?.toDate) date = date.toDate();
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const categoryColors: Record<string, string> = {
    'Equipment': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Ground Fees': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Travel': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Tournament Fees': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Food & Beverages': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Team Kit': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Miscellaneous': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading budget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-soft-orange-100">
          <DollarSign className="w-6 h-6 text-soft-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget & Finances</h1>
          <p className="text-sm text-gray-600">Complete financial transparency - track every dollar</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Budget" value={`$${totalBudget.toLocaleString()}`} subtitle="Season allocation" icon={Wallet} color="soft-orange" />
        <StatCard title="Total Spent" value={`$${totalSpent.toLocaleString()}`} subtitle={`${spentPercentage.toFixed(1)}% used`} icon={TrendingDown} color="soft-blue" />
        <StatCard title="Remaining" value={`$${remaining.toLocaleString()}`} subtitle={`${(100 - spentPercentage).toFixed(1)}% left`} icon={TrendingUp} color="soft-orange" />
        <StatCard title="Transactions" value={expenses.length} subtitle="Total expenses" icon={AlertCircle} color="soft-blue" />
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">Budget Usage</h3>
          <div className="flex justify-center">
            <ProgressRing progress={spentPercentage} size={140} strokeWidth={12} color="#9333EA" showPercentage />
          </div>
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${remaining.toLocaleString()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Remaining Budget</div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(categoryTotals).map(([category, amount]) => {
              const percentage = (amount / totalSpent) * 100;
              return (
                <div key={category}>
                  <div className="flex justify-between mb-1">
                    <Badge variant="default" size="sm" className={categoryColors[category]}>{category}</Badge>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">${amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Expenses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Recent Expenses</h2>
          <Link to="/admin/budget/add">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Expense
            </Button>
          </Link>
        </div>

        {expenses.length === 0 ? (
          <EmptyState icon={DollarSign} title="No Expenses Recorded" description="Start tracking expenses to maintain complete financial transparency!" action={
            <Link to="/admin/budget/add"><Button variant="primary">Add First Expense</Button></Link>
          } />
        ) : (
          <Card className="p-6">
            <div className="space-y-4">
              {expenses.slice(0, 10).map((expense, index) => (
                <motion.div key={expense.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default" size="sm" className={categoryColors[expense.category]}>{expense.category}</Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-500">{formatDate(expense.date)}</span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{expense.description}</p>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">${expense.amount.toLocaleString()}</div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
