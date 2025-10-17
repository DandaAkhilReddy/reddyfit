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
import AdminDashboard from './pages/admin/Dashboard';
import Players from './pages/admin/Players';
import PlayerForm from './pages/admin/PlayerForm';
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

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/players" element={<Players />} />
        <Route path="/admin/players/add" element={<PlayerForm />} />
        <Route path="/admin/players/edit/:id" element={<PlayerForm />} />

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
