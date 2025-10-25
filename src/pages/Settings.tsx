/**
 * Settings Page Component
 *
 * Allows users to configure Notion API integration.
 * Stores API keys securely in Firestore (user-specific).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserSettings, saveUserSettings } from '../services/firestore';
import { verifyNotionConnection } from '../services/notion';
import NotionOnboarding from '../components/NotionOnboarding';
import './Settings.css';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notionApiKey, setNotionApiKey] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasNotionSetup, setHasNotionSetup] = useState(false);

  useEffect(() => {
    if (!user) return;

    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const settings = await getUserSettings(user.uid);
      if (settings) {
        setNotionApiKey(settings.notionApiKey || '');
        setNotionDatabaseId(settings.notionDatabaseId || '');
        setHasNotionSetup(!!settings.notionApiKey && !!settings.notionDatabaseId);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNotionIntegrations = () => {
    window.open('https://www.notion.so/my-integrations', '_blank');
  };

  const handleOnboardingComplete = async (apiKey: string, databaseId: string) => {
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      await saveUserSettings(user.uid, {
        notionApiKey: apiKey,
        notionDatabaseId: databaseId,
      });

      setNotionApiKey(apiKey);
      setNotionDatabaseId(databaseId);
      setHasNotionSetup(true);
      setShowOnboarding(false);
      setMessageType('success');
      setMessage('Notion integration configured successfully!');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectNotion = async () => {
    if (!user) return;

    const confirmed = window.confirm('Are you sure you want to disconnect Notion? Your entries will no longer sync.');
    if (!confirmed) return;

    setSaving(true);
    try {
      await saveUserSettings(user.uid, {
        notionApiKey: '',
        notionDatabaseId: '',
      });

      setNotionApiKey('');
      setNotionDatabaseId('');
      setHasNotionSetup(false);
      setMessageType('success');
      setMessage('Notion disconnected successfully.');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.message || 'Failed to disconnect Notion');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      // Verify Notion connection if credentials are provided
      if (notionApiKey && notionDatabaseId) {
        const isValid = await verifyNotionConnection(notionApiKey, notionDatabaseId);

        if (!isValid) {
          setMessageType('error');
          setMessage('Invalid Notion credentials. Please check your API key and database ID.');
          setSaving(false);
          return;
        }
      }

      await saveUserSettings(user.uid, {
        notionApiKey,
        notionDatabaseId,
      });

      setHasNotionSetup(!!notionApiKey && !!notionDatabaseId);
      setMessageType('success');
      setMessage('Settings saved successfully!');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-container">
      <header className="settings-header">
        <button onClick={() => navigate('/feed')} className="back-btn">
          ← Back to Feed
        </button>
      </header>

      <main className="settings-main">
        <h1>Settings</h1>

        {loading ? (
          <div className="loading">Loading settings...</div>
        ) : (
          <>
            <section className="settings-section">
              <h2>Notion Integration</h2>
              <p className="section-description">
                Connect your Notion database to automatically sync food entries.
              </p>

              {!hasNotionSetup ? (
                /* No Notion setup yet - show setup button */
                <div className="notion-setup-prompt">
                  <div className="setup-prompt-content">
                    <span className="setup-icon">📔</span>
                    <div>
                      <h3>Notion Not Connected</h3>
                      <p>
                        Connect Notion to automatically sync your food entries to a beautiful database you can customize and search.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-large"
                    onClick={() => setShowOnboarding(true)}
                  >
                    Set Up Notion Integration
                  </button>
                </div>
              ) : (
                /* Notion is already set up - show status */
                <div className="notion-status">
                  <div className="status-header">
                    <div className="status-indicator">
                      <span className="status-icon">✅</span>
                      <div>
                        <h3>Connected to Notion</h3>
                        <p>Your entries are syncing automatically</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => window.open(`https://notion.so/${notionDatabaseId.replace(/-/g, '')}`, '_blank')}
                    >
                      View Database →
                    </button>
                  </div>

                  <details className="advanced-settings">
                    <summary>Advanced Settings</summary>
                    <form onSubmit={handleSave} className="settings-form">
                      <div className="form-group">
                        <label htmlFor="notionApiKey">Notion API Key</label>
                        <div className="input-with-button">
                          <input
                            type="password"
                            id="notionApiKey"
                            value={notionApiKey}
                            onChange={(e) => setNotionApiKey(e.target.value)}
                            placeholder="secret_..."
                            className="input"
                          />
                          <button
                            type="button"
                            onClick={handleOpenNotionIntegrations}
                            className="btn btn-secondary btn-inline"
                          >
                            Get API Key →
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="notionDatabaseId">Notion Database ID</label>
                        <input
                          type="text"
                          id="notionDatabaseId"
                          value={notionDatabaseId}
                          onChange={(e) => setNotionDatabaseId(e.target.value)}
                          placeholder="abc123def456..."
                          className="input"
                        />
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                          {saving ? 'Saving...' : 'Update Settings'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={handleDisconnectNotion}
                          disabled={saving}
                        >
                          Disconnect Notion
                        </button>
                      </div>
                    </form>
                  </details>
                </div>
              )}

              {message && (
                <div className={`message ${messageType}`}>{message}</div>
              )}
            </section>

            {/* Show onboarding modal when triggered */}
            {showOnboarding && (
              <NotionOnboarding
                onComplete={handleOnboardingComplete}
                onCancel={() => setShowOnboarding(false)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
