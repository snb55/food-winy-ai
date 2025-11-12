/**
 * Sign In Modal Component
 *
 * Reusable modal component for user authentication (login and signup).
 * Extracted from Login.tsx for use in homepage and other locations.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import './SignInModal.css';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export default function SignInModal({ isOpen, onClose, redirectTo }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

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
      // Success - close and optionally redirect
      onClose();
      if (redirectTo) {
        navigate(redirectTo);
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
      // Success - close and optionally redirect
      onClose();
      if (redirectTo) {
        navigate(redirectTo);
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-modal-overlay" onClick={onClose}>
      <div className="signin-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="signin-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        
        <div className="signin-modal-header">
          <img src="/favicon.png" alt="food.winy.ai" className="signin-modal-logo" />
          <h2>food.winy.ai</h2>
        </div>

        <p className="signin-modal-tagline">Track what you eat, effortlessly.</p>

        <form onSubmit={handleEmailAuth} className="signin-modal-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="signin-modal-input"
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="signin-modal-input"
            disabled={loading}
          />

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading...' : isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="signin-modal-divider">
          <span>or</span>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="btn btn-secondary"
          disabled={loading}
        >
          Continue with Google
        </button>

        {error && <p className="signin-modal-error">{error}</p>}

        <button
          onClick={() => setIsSignup(!isSignup)}
          className="signin-modal-toggle"
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

