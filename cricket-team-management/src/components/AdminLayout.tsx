import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Activity,
  Package,
  DollarSign,
  MessageSquare,
  UserCog,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Home,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser, isAdmin, signOut } = useAuth();
  const location = useLocation();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const navigation = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Players', path: '/admin/players', icon: Users },
    { name: 'Matches', path: '/admin/matches', icon: Calendar },
    { name: 'Practice', path: '/admin/practice', icon: Activity },
    { name: 'Equipment', path: '/admin/equipment', icon: Package },
    { name: 'Budget', path: '/admin/budget', icon: DollarSign },
    { name: 'Communications', path: '/admin/communications', icon: MessageSquare },
    { name: 'Users', path: '/admin/users', icon: UserCog },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-xl font-heading font-bold text-island-gradient">
            Admin Panel
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Site</span>
          </Link>
          <div className="flex items-center gap-3">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-island-blue-500 flex items-center justify-center text-white font-bold">
                {currentUser?.displayName?.charAt(0) || 'A'}
              </div>
            )}
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {currentUser?.displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.3 }}
        className="fixed top-16 left-0 bottom-0 w-70 bg-white dark:bg-gray-800 border-r dark:border-gray-700 z-20 overflow-y-auto"
      >
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-island-blue-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'pl-70' : 'pl-0'
        }`}
      >
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
