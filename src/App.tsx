/**
 * Main App Component
 *
 * Root component handling routing and authentication state.
 * Routes users to Home (landing page) or Feed based on authentication status.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Settings from './pages/Settings';
import MainChartEmbed from './pages/embed/MainChartEmbed';
import ProteinGoalEmbed from './pages/embed/ProteinGoalEmbed';
import CalorieLimitEmbed from './pages/embed/CalorieLimitEmbed';
import ProteinStreakEmbed from './pages/embed/ProteinStreakEmbed';
import CalorieStreakEmbed from './pages/embed/CalorieStreakEmbed';
import NotionCallback from './pages/NotionCallback';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <img src="/favicon.png" alt="Loading" className="loading-logo" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/feed" replace /> : <Home />}
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/feed" replace /> : <Login />}
          />
          <Route
            path="/feed"
            element={user ? <Feed /> : <Navigate to="/" replace />}
          />
          <Route
            path="/settings"
            element={user ? <Settings /> : <Navigate to="/" replace />}
          />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/auth/notion/callback"
            element={<NotionCallback />}
          />
          {/* Public embed routes (no auth required) */}
          <Route path="/embed/main-chart/:token" element={<MainChartEmbed />} />
          <Route path="/embed/protein-goal/:token" element={<ProteinGoalEmbed />} />
          <Route path="/embed/calorie-limit/:token" element={<CalorieLimitEmbed />} />
          <Route path="/embed/protein-streak/:token" element={<ProteinStreakEmbed />} />
          <Route path="/embed/calorie-streak/:token" element={<CalorieStreakEmbed />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
