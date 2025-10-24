// App.SIMPLE.tsx - Simplified 2-Feature App: Video Exercise Extraction + Complete Nutrition
import { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from './hooks/useAdminAuth';
import { ToastProvider, useToast } from './hooks/useToast';
import AdminLoginPage from './components/AdminLoginPage';
import VideoExerciseExtractor from './components/VideoExerciseExtractor';
import CompleteNutritionTracker from './components/CompleteNutritionTracker';

function AppContent() {
  const { user, loading, signOut } = useAdminAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'video' | 'nutrition'>('video');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                ReddyFit Pro
              </h1>
              <p className="text-xs text-slate-400">Video Exercise & Complete Nutrition</p>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="text-slate-300 text-sm hidden sm:block">
                👤 {user.displayName || user.email}
              </span>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-slate-800/30 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2">
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'video'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                🎥 <span className="hidden sm:inline">Video Exercise Extractor</span>
                <span className="sm:hidden">Video</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('nutrition')}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'nutrition'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                🍔 <span className="hidden sm:inline">Complete Nutrition</span>
                <span className="sm:hidden">Nutrition</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'video' ? (
          <VideoExerciseExtractor />
        ) : (
          <CompleteNutritionTracker />
        )}
      </main>

      {/* Footer Info */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-xs text-blue-400">
          ☁️ Azure Cosmos DB
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-purple-400">
          🤖 Gemini AI
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AdminAuthProvider>
        <AppContent />
      </AdminAuthProvider>
    </ToastProvider>
  );
}
