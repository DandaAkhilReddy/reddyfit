import type { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              <span className="text-island-gradient font-heading font-bold">Islanders Cricket Team</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Proudly sponsored by <span className="font-semibold text-texas-gold-600">Dr. Vishnu Reddy & Dr. Veena Reddy</span> • HHA Medicine
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
              From the shores of Corpus Christi, Texas 🏝️
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
