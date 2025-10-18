import type { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Activity,
  Package,
  DollarSign,
  MessageSquare,
  LogOut,
  Home,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Fixed Left Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-soft-orange-50 border-r border-soft-orange-200 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-soft-orange-200">
          <h1 className="text-2xl font-bold text-soft-orange-600">
            Islanders
          </h1>
          <p className="text-sm text-soft-orange-500 mt-1">Admin Panel</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-soft-orange-400 text-white font-semibold'
                    : 'text-soft-orange-700 hover:bg-soft-orange-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-soft-orange-200 p-4 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-soft-blue-600 hover:bg-soft-blue-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Back to Site</span>
          </Link>

          <div className="flex items-center gap-3 px-4 py-2">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-soft-orange-400 flex items-center justify-center text-white text-sm font-bold">
                {currentUser?.displayName?.charAt(0) || 'A'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser?.displayName}
              </p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <main className="p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
