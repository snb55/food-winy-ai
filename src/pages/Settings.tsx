/**
 * Settings Page Component
 *
 * Allows users to configure Notion API integration.
 * Stores API keys securely in Firestore (user-specific).
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserSettings, saveUserSettings, createSchema, setActiveSchema } from '../services/firestore';
import { verifyNotionConnection } from '../services/notion';
import NotionOnboarding from '../components/NotionOnboarding';
import DashboardSettings from '../components/DashboardSettings';
import { createSchemaFromTemplate } from '../constants/schemaTemplates';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import type { UserSettings } from '../types';
import './Settings.css';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notionApiKey, setNotionApiKey] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasNotionSetup, setHasNotionSetup] = useState(false);
  const [showDashboardSettings, setShowDashboardSettings] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [proteinGoal, setProteinGoal] = useState<number>(150);
  const [calorieLimit, setCalorieLimit] = useState<number>(2000);

  useEffect(() => {
    if (!user) return;

    loadSettings();

    // Check if returning from OAuth callback
    const state = location.state as { notionOAuthSuccess?: boolean; notionAccessToken?: string };
    if (state?.notionOAuthSuccess && state?.notionAccessToken) {
      // OAuth completed successfully, reload settings to get the token
      loadSettings().then(() => {
        // Open onboarding to continue with database selection
        setShowOnboarding(true);
        setMessage('Successfully connected to Notion! Continue by selecting a database.');
        setMessageType('success');
        // Clear location state
        navigate(location.pathname, { replace: true, state: {} });
      });
    }
  }, [user, location.state]);

  const loadSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const settings = await getUserSettings(user.uid);
      if (settings) {
        setNotionApiKey(settings.notionApiKey || '');
        setNotionDatabaseId(settings.notionDatabaseId || '');
        setHasNotionSetup(!!settings.notionApiKey && !!settings.notionDatabaseId);
        setUserSettings(settings);
        setProteinGoal(settings.proteinGoal || 150);
        setCalorieLimit(settings.calorieLimit || 2000);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDashboardSettingsSave = (updatedSettings: UserSettings) => {
    setUserSettings(updatedSettings);
    setShowDashboardSettings(false);
    loadSettings(); // Reload to refresh UI
  };

  const handleOpenNotionIntegrations = () => {
    window.open('https://www.notion.so/my-integrations', '_blank');
  };

  const handleOnboardingComplete = async (apiKey: string, databaseId: string, templateId: string) => {
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      // Create schema from template and save to Firestore
      let savedSchemaId: string | undefined;
      if (templateId) {
        const schemaData = createSchemaFromTemplate(templateId, user.uid);
        const savedSchema = await createSchema(schemaData);
        savedSchemaId = savedSchema.id;

        // Set as active schema
        await setActiveSchema(user.uid, savedSchemaId);
        console.log('Created and activated schema:', savedSchemaId);
      }

      // Save settings including template ID
      await saveUserSettings(user.uid, {
        notionApiKey: apiKey,
        notionDatabaseId: databaseId,
        templateId: templateId,
        activeSchemaId: savedSchemaId,
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      await saveUserSettings(user.uid, {
        proteinGoal,
        calorieLimit,
      });

      setMessageType('success');
      setMessage('Goals and limits saved successfully!');

      // Reload settings to update userSettings state
      await loadSettings();
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.message || 'Failed to save goals');
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

            {/* Dashboard Settings Section */}
            <section className="settings-section">
              <h2>Dashboard Settings</h2>
              <p className="section-description">
                Customize which charts appear in your dashboard and get embed URLs to share them in Notion.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowDashboardSettings(true)}
              >
                Edit Dashboard
              </button>
            </section>

            {/* Goals & Limits Section */}
            <section className="settings-section">
              <h2>Goals & Limits</h2>
              <p className="section-description">
                Set your daily protein goal and calorie limit to track progress and streaks.
              </p>
              <form onSubmit={handleSaveGoals} className="goals-form">
                <div className="form-group">
                  <label htmlFor="proteinGoal">Daily Protein Goal (g)</label>
                  <input
                    type="number"
                    id="proteinGoal"
                    value={proteinGoal}
                    onChange={(e) => setProteinGoal(Number(e.target.value))}
                    placeholder="150"
                    min="0"
                    className="input"
                  />
                  <p className="input-hint">How many grams of protein you want to consume daily</p>
                </div>

                <div className="form-group">
                  <label htmlFor="calorieLimit">Daily Calorie Limit (kcal)</label>
                  <input
                    type="number"
                    id="calorieLimit"
                    value={calorieLimit}
                    onChange={(e) => setCalorieLimit(Number(e.target.value))}
                    placeholder="2000"
                    min="0"
                    className="input"
                  />
                  <p className="input-hint">Maximum calories you want to consume daily</p>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Goals'}
                  </button>
                </div>
              </form>
            </section>

            {/* Show onboarding modal when triggered */}
            {showOnboarding && (
              <NotionOnboarding
                onComplete={handleOnboardingComplete}
                onCancel={() => setShowOnboarding(false)}
                userId={user?.uid || ''}
                initialApiKey={notionApiKey || (location.state as { notionAccessToken?: string })?.notionAccessToken}
              />
            )}

            {/* Show dashboard settings modal when triggered */}
            {showDashboardSettings && user && userSettings && (
              <DashboardSettings
                userId={user.uid}
                settings={userSettings}
                onSave={handleDashboardSettingsSave}
                onClose={() => setShowDashboardSettings(false)}
              />
            )}

            {/* User Info Section */}
            {user && (
              <section className="user-info-section">
                <div className="user-info">
                  <p className="logged-in-as">
                    Logged in as: <strong>{user.email}</strong>
                  </p>
                  <button
                    onClick={handleLogout}
                    className="btn btn-logout"
                  >
                    Log Out
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
