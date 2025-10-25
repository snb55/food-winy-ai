/**
 * Main App Component
 *
 * Root component handling routing and authentication state.
 * Routes users to Login or Feed based on authentication status.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Settings from './pages/Settings';
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
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
