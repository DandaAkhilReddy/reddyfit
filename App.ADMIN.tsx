// App.ADMIN.tsx - Admin-Only Version with Azure Database
import { useState, useEffect } from 'react';
import { AdminAuthProvider, useAdminAuth } from './hooks/useAdminAuth';
import { ToastProvider, useToast } from './hooks/useToast';
import { UserPreferencesProvider } from './hooks/useUserPreferences';
import AdminLoginPage from './components/AdminLoginPage';
import Dashboard from './components/Dashboard';
import GymAnalyzer from './components/GymAnalyzer';
import FitnessChat from './components/FitnessChat';
import ExerciseLibrary from './components/ExerciseLibrary';
import Settings from './components/Settings';
import { initializeDatabase } from './services/azureDbService';

// Navigation component
function AppContent() {
  const { user, loading, signOut } = useAdminAuth();
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // Initialize Azure Cosmos DB on app load
    initializeDatabase().catch((error) => {
      console.error('Database initialization error:', error);
      showToast('Database initialization failed. Running in offline mode.', 'warning');
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AdminLoginPage />;
  }

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} userProfile={user} />;
      case 'gym':
        return <GymAnalyzer user={user} userProfile={user} />;
      case 'chat':
        return <FitnessChat user={user} userProfile={user} />;
      case 'library':
        return <ExerciseLibrary user={user} userProfile={user} />;
      case 'settings':
        return <Settings user={user} userProfile={user} />;
      default:
        return <Dashboard user={user} userProfile={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Bar */}
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                ReddyFit Admin
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavButton active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')}>
                  📊 Dashboard
                </NavButton>
                <NavButton active={currentPage === 'gym'} onClick={() => setCurrentPage('gym')}>
                  💪 Gym Analyzer
                </NavButton>
                <NavButton active={currentPage === 'chat'} onClick={() => setCurrentPage('chat')}>
                  💬 AI Coach
                </NavButton>
                <NavButton active={currentPage === 'library'} onClick={() => setCurrentPage('library')}>
                  📚 Exercises
                </NavButton>
                <NavButton active={currentPage === 'settings'} onClick={() => setCurrentPage('settings')}>
                  ⚙️ Settings
                </NavButton>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="text-slate-300 text-sm">
                👤 {user.displayName || user.email}
              </span>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-slate-800/50 border-b border-slate-700/50 overflow-x-auto">
        <div className="flex px-4 py-2 space-x-2">
          <NavButton active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')}>
            📊
          </NavButton>
          <NavButton active={currentPage === 'gym'} onClick={() => setCurrentPage('gym')}>
            💪
          </NavButton>
          <NavButton active={currentPage === 'chat'} onClick={() => setCurrentPage('chat')}>
            💬
          </NavButton>
          <NavButton active={currentPage === 'library'} onClick={() => setCurrentPage('library')}>
            📚
          </NavButton>
          <NavButton active={currentPage === 'settings'} onClick={() => setCurrentPage('settings')}>
            ⚙️
          </NavButton>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderPage()}
      </main>

      {/* Azure Indicator */}
      <div className="fixed bottom-4 right-4 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-xs text-blue-400">
        ☁️ Azure Cosmos DB
      </div>
    </div>
  );
}

// Navigation Button Component
function NavButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-amber-600 text-white'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

// Main App with Providers
export default function App() {
  return (
    <ToastProvider>
      <AdminAuthProvider>
        <UserPreferencesProvider>
          <AppContent />
        </UserPreferencesProvider>
      </AdminAuthProvider>
    </ToastProvider>
  );
}
