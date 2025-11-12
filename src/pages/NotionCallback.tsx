/**
 * Notion OAuth Callback Handler
 * 
 * Handles the OAuth redirect from Notion after user authorization
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../config/firebase';
import './NotionCallback.css';

export default function NotionCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      // Handle OAuth errors from Notion
      if (error) {
        setStatus('error');
        setError(error === 'access_denied' 
          ? 'Authorization was cancelled. Please try again.' 
          : `OAuth error: ${error}`);
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      // Missing authorization code
      if (!code) {
        setStatus('error');
        setError('No authorization code received from Notion.');
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      try {
        // Exchange code for access token via Cloud Function
        const functions = getFunctions(app, 'us-central1');
        const exchangeToken = httpsCallable(functions, 'notionExchangeOAuthToken');
        
        const result = await exchangeToken({ code });
        const data = result.data as { accessToken: string; workspace: string };

        // Store access token in user settings (will be handled by Settings component)
        // For now, we'll redirect to settings with the token in state
        // In a real implementation, we'd store it in Firestore here
        
        setStatus('success');
        
        // Redirect to settings page with success message
        // The Settings component will handle fetching and storing the token
        setTimeout(() => {
          navigate('/settings', { 
            state: { 
              notionOAuthSuccess: true,
              notionAccessToken: data.accessToken,
              notionWorkspace: data.workspace
            } 
          });
        }, 2000);
      } catch (err: any) {
        console.error('Error exchanging OAuth token:', err);
        setStatus('error');
        setError(err.message || 'Failed to connect to Notion. Please try again.');
        setTimeout(() => navigate('/settings'), 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="notion-callback-container">
      <div className="notion-callback-content">
        {status === 'loading' && (
          <>
            <div className="loading-spinner" />
            <h2>Connecting to Notion...</h2>
            <p>Please wait while we complete the connection.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✓</div>
            <h2>Successfully Connected!</h2>
            <p>Redirecting you to settings...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">✗</div>
            <h2>Connection Failed</h2>
            <p>{error}</p>
            <p className="redirect-text">Redirecting to settings...</p>
          </>
        )}
      </div>
    </div>
  );
}


