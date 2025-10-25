/**
 * Login Page Component
 *
 * Handles user authentication (login and signup) using Firebase Auth.
 * Minimal, Notion-style design with black and white color scheme.
 */

import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo">
          <img src="/favicon.png" alt="food.winy.ai" className="logo-img" />
          <h1>food.winy.ai</h1>
        </div>

        <p className="tagline">Track what you eat, effortlessly.</p>

        <form onSubmit={handleEmailAuth} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
            disabled={loading}
          />

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading...' : isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="btn btn-secondary"
          disabled={loading}
        >
          Continue with Google
        </button>

        {error && <p className="error">{error}</p>}

        <button
          onClick={() => setIsSignup(!isSignup)}
          className="toggle-auth"
          disabled={loading}
        >
          {isSignup
            ? 'Already have an account? Log in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
