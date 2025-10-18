import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Loader from './components/Loader';
import { useAuth } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Squad from './pages/Squad';
import Leadership from './pages/Leadership';
import Matches from './pages/Matches';
import Practice from './pages/Practice';
import Equipment from './pages/Equipment';
import Budget from './pages/Budget';
import Communications from './pages/Communications';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import PlayerProfile from './pages/PlayerProfile';
import AdminDashboard from './pages/admin/Dashboard';
import Players from './pages/admin/Players';
import PlayerForm from './pages/admin/PlayerForm';
import AdminMatches from './pages/admin/AdminMatches';
import AdminPractice from './pages/admin/AdminPractice';
import AdminEquipment from './pages/admin/AdminEquipment';
import AdminBudget from './pages/admin/AdminBudget';
import AdminCommunications from './pages/admin/AdminCommunications';
import ScorerHome from './pages/scorer/ScorerHome';
import LiveScoring from './pages/scorer/LiveScoring';
import LiveMatch from './pages/LiveMatch';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/squad" element={<Squad />} />
        <Route path="/leadership" element={<Leadership />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<ProtectedRoute><PlayerProfile /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/players" element={<Players />} />
        <Route path="/admin/players/add" element={<PlayerForm />} />
        <Route path="/admin/players/edit/:id" element={<PlayerForm />} />
        <Route path="/admin/matches" element={<AdminMatches />} />
        <Route path="/admin/practice" element={<AdminPractice />} />
        <Route path="/admin/equipment" element={<AdminEquipment />} />
        <Route path="/admin/budget" element={<AdminBudget />} />
        <Route path="/admin/communications" element={<AdminCommunications />} />

        {/* Scorer Routes */}
        <Route path="/scorer" element={<ScorerHome />} />
        <Route path="/scorer/match/:id" element={<LiveScoring />} />

        {/* Public Live Match View */}
        <Route path="/live/:id" element={<LiveMatch />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
