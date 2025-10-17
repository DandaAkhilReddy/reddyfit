import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Users,
  Calendar,
  Activity,
  Package,
  DollarSign,
  MessageSquare,
  Settings,
  LogIn,
  LogOut,
  Menu,
  X,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Squad', path: '/squad', icon: Users },
    { name: 'Leadership', path: '/leadership', icon: Trophy },
    { name: 'Matches', path: '/matches', icon: Calendar },
    { name: 'Practice', path: '/practice', icon: Activity },
    { name: 'Equipment', path: '/equipment', icon: Package },
    { name: 'Budget', path: '/budget', icon: DollarSign },
    { name: 'Communications', path: '/communications', icon: MessageSquare },
  ];

  const adminNav = [
    { name: 'Admin Dashboard', path: '/admin', icon: Settings },
  ];

  const playerNav = [
    { name: 'My Dashboard', path: '/dashboard', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-island-blue-500 to-cricket-green-500 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-heading font-bold text-island-gradient">
                Islanders Cricket
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Corpus Christi, TX</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-island-blue-500 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-island-blue-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </motion.div>
                </Link>
              );
            })}

            {/* Admin/Player Dashboard Link */}
            {isAdmin &&
              adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-texas-gold-500 text-gray-900'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-texas-gold-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </motion.div>
                  </Link>
                );
              })}

            {currentUser && !isAdmin &&
              playerNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-cricket-green-500 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-cricket-green-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </motion.div>
                  </Link>
                );
              })}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {currentUser ? (
              <>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {currentUser.displayName}
                </span>
                <Button size="sm" variant="outline" onClick={handleSignOut}>
                  <div className="flex items-center space-x-1">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </div>
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm">
                  <div className="flex items-center space-x-1">
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </div>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700"
        >
          <div className="px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                      isActive(item.path)
                        ? 'bg-island-blue-500 text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                </Link>
              );
            })}

            {currentUser ? (
              <>
                <div className="border-t dark:border-gray-700 my-2 pt-2">
                  <p className="px-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {currentUser.displayName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-island-blue-500 text-white">
                  <LogIn className="w-5 h-5" />
                  <span className="font-medium">Sign In</span>
                </div>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
