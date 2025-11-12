/**
 * Notion Onboarding Component
 *
 * Guided wizard to help users set up Notion integration easily.
 * Can automatically create a database or let users choose an existing one.
 */

import { useState, useEffect } from 'react';
import {
  verifyNotionConnection,
  listUserDatabases,
  createFoodLogDatabase,
  type NotionDatabase
} from '../services/notion';
import { SCHEMA_TEMPLATES, createSchemaFromTemplate } from '../constants/schemaTemplates';
import HierarchicalPageSelector from './HierarchicalPageSelector';
import './NotionOnboarding.css';

interface NotionOnboardingProps {
  onComplete: (apiKey: string, databaseId: string, schemaId: string) => void;
  onCancel: () => void;
  userId?: string; // Optional until template selection is implemented
  initialApiKey?: string; // Optional: Access token from OAuth
}

type Step = 'intro' | 'select-schema' | 'oauth-connect' | 'choose-database' | 'create-database' | 'success';

// Notion OAuth Configuration
const NOTION_CLIENT_ID = '29cd872b-594c-80ad-ae12-0037a2146fac';
const NOTION_REDIRECT_URI = window.location.origin === 'http://localhost:5173' 
  ? 'http://localhost:5173/auth/notion/callback'
  : 'https://food.winy.ai/auth/notion/callback';

export default function NotionOnboarding({ onComplete, onCancel, initialApiKey }: NotionOnboardingProps) {
  const [step, setStep] = useState<Step>(initialApiKey ? 'choose-database' : 'intro');
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  const [databaseId, setDatabaseId] = useState('');
  const [schemaId, setSchemaId] = useState('');
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [selectedParentPageId, setSelectedParentPageId] = useState<string>(''); // NEW: Selected page for database creation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // This function is called when user returns from OAuth or when API key is already set
  const handleLoadDatabases = async (accessToken: string) => {
    setApiKey(accessToken);
    setLoading(true);
    setError('');

    try {
      // Verify the access token by listing databases
      const userDatabases = await listUserDatabases(accessToken);
      setDatabases(userDatabases);
      setStep('choose-database');
    } catch (err: any) {
      console.error('Database listing error:', err);

      // Provide specific error message based on error type
      if (err.message?.includes('must be logged in') || err.message?.includes('Authentication failed')) {
        setError('⚠️ Authentication issue detected. Please try signing out and signing back in from Settings.');
      } else {
        setError(err.message || 'Failed to load databases. Please try connecting again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // If initialApiKey is provided (from OAuth), automatically load databases
  useEffect(() => {
    if (initialApiKey && initialApiKey !== apiKey && initialApiKey.trim()) {
      setApiKey(initialApiKey);
      handleLoadDatabases(initialApiKey);
    }
  }, [initialApiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSchemaSelect = async (templateId: string) => {
    console.log('Template selected:', templateId);

    // Store the template ID (we'll create schema from it when creating the database)
    setSchemaId(templateId);
    setStep('oauth-connect');
  };

  const handleOAuthConnect = () => {
    // Build OAuth authorization URL
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(NOTION_REDIRECT_URI)}`;
    
    // Redirect to Notion OAuth
    window.location.href = authUrl;
  };

  // const handleCustomSchema = () => {
  //   // TODO: Implement custom schema editor in Phase 2
  //   setError('Custom schema editor coming soon! Please select a template for now.');
  // };

  const handleCreateNewDatabase = async () => {
    // Validate that a parent page was selected
    if (!selectedParentPageId) {
      setError('Please select a page where the database will be created.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get schema from template if one was selected
      let schema = null;
      if (schemaId) {
        schema = createSchemaFromTemplate(schemaId, 'temp-user');
      }

      const newDatabaseId = await createFoodLogDatabase(apiKey, selectedParentPageId, schema);
      setDatabaseId(newDatabaseId);
      setStep('success');
    } catch (err: any) {
      console.error('Database creation error:', err);
      setError(err.message || 'Failed to create database. Make sure you have shared at least one page with your Notion integration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExistingDatabase = async (selectedDatabaseId: string) => {
    setLoading(true);
    setError('');

    try {
      // Verify connection to the selected database
      const isValid = await verifyNotionConnection(apiKey, selectedDatabaseId);

      if (!isValid) {
        setError('Unable to access this database. Make sure it\'s shared with your integration.');
        return;
      }

      setDatabaseId(selectedDatabaseId);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to connect to database.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete(apiKey, databaseId, schemaId);
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* Intro Step */}
        {step === 'intro' && (
          <div className="onboarding-step">
            <h2>Set Up Notion Integration</h2>
            <p className="onboarding-description">
              Winy AI Food can automatically sync your food entries to Notion,
              creating a beautiful food journal you can customize and search.
            </p>

            <div className="onboarding-features">
              <div className="feature">
                <span className="feature-icon">🤖</span>
                <div>
                  <h3>Automatic Setup</h3>
                  <p>We'll create a Food Log database for you</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">🔄</span>
                <div>
                  <h3>Auto Sync</h3>
                  <p>Every entry automatically appears in Notion</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">✨</span>
                <div>
                  <h3>AI Summaries</h3>
                  <p>Get smart insights about your meals</p>
                </div>
              </div>
            </div>

            <div className="onboarding-actions">
              <button
                className="btn btn-primary btn-large"
                onClick={() => setStep('select-schema')}
              >
                Get Started
              </button>
              <button
                className="btn btn-text"
                onClick={onCancel}
              >
                Maybe Later
              </button>
            </div>
          </div>
        )}

        {/* Schema Selection Step */}
        {step === 'select-schema' && (
          <div className="onboarding-step">
            <h2>Select Tracking Template</h2>
            <p>Choose what you want to track in your food log:</p>

            <div className="schema-options" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              {SCHEMA_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleSchemaSelect(template.id)}
                  style={{
                    padding: '1.5rem',
                    border: '2px solid #e5e5e5',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: '#ffffff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#000000';
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e5e5';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>{template.icon}</span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{template.name}</h3>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9375rem' }}>{template.description}</p>
                      <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#888' }}>
                        <strong>Tracks:</strong> {template.fields.filter(f => f.extractFromAI || f.id === 'photo').map(f => f.name).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="back-btn" onClick={() => setStep('intro')} style={{ marginTop: '1.5rem' }}>
              ← Back
            </button>

            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        {/* OAuth Connect Step */}
        {step === 'oauth-connect' && (
          <div className="onboarding-step">
            <button className="back-btn" onClick={() => setStep('select-schema')}>
              ← Back
            </button>

            <h2>Connect Your Notion Account</h2>
            <p className="onboarding-description">
              Connect your Notion workspace with one click. No API keys needed!
            </p>

            <div className="onboarding-instructions">
              <h3>How it works:</h3>
              <ol>
                <li>
                  Click <strong>"Connect with Notion"</strong> below
                </li>
                <li>
                  Authorize Winy AI Food in your Notion workspace
                </li>
                <li>
                  We'll automatically connect and sync your food entries
                </li>
              </ol>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="onboarding-actions">
              <button
                className="btn btn-primary btn-large"
                onClick={handleOAuthConnect}
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Connect with Notion'}
              </button>
              <button
                className="btn btn-text"
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Choose Database Step */}
        {step === 'choose-database' && (
          <div className="onboarding-step">
            <button className="back-btn" onClick={() => setStep('oauth-connect')}>
              ← Back
            </button>

            <h2>Choose Where to Create Database</h2>
            <p className="onboarding-description">
              {databases.filter(d => d.type === 'page').length > 0
                ? 'We\'ll create a new Food Log database inside one of your pages.'
                : 'You need to create and share a page with your integration first.'}
            </p>

            {databases.filter(d => d.type === 'page').length === 0 ? (
              <div className="database-option database-option-create" style={{backgroundColor: '#fff3cd', padding: '20px', borderRadius: '8px', border: '1px solid #ffc107'}}>
                <div className="option-content">
                  <span className="option-icon">📝</span>
                  <div>
                    <h3>Quick Setup Required</h3>
                    <p style={{marginBottom: '12px'}}>Due to Notion's security policies, you need to:</p>
                    <ol style={{textAlign: 'left', paddingLeft: '20px', marginBottom: '12px'}}>
                      <li>Create a new page in your Notion workspace</li>
                      <li>Click the "••• " menu → "Add connections"</li>
                      <li>Select "Winy AI Food" integration</li>
                      <li>Come back here and refresh</li>
                    </ol>
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => window.open('https://www.notion.so', '_blank')}
                >
                  Open Notion →
                </button>
              </div>
            ) : (
              <div className="database-options">
                {/* Create New Option */}
                <div className="database-option database-option-create">
                  <div className="option-content" style={{ width: '100%' }}>
                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                      <span className="option-icon" style={{ fontSize: '2rem' }}>✨</span>
                      <h3 style={{ margin: '0.5rem 0 0 0' }}>Create New Database</h3>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>Select a page where the database will be created:</p>
                    </div>

                    {/* Hierarchical Page Selector */}
                    <HierarchicalPageSelector
                      pages={databases}
                      selectedPageId={selectedParentPageId}
                      onSelectPage={setSelectedParentPageId}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateNewDatabase}
                    disabled={loading || !selectedParentPageId}
                  >
                    {loading ? 'Creating...' : 'Create for Me'}
                  </button>
                </div>

                {/* Existing Databases */}
                {databases.filter(d => d.type === 'database').length > 0 && (
                  <>
                    <div className="option-divider">
                      <span>or choose existing database</span>
                    </div>

                    <div className="existing-databases">
                      {databases.filter(d => d.type === 'database').map((db) => (
                        <div key={db.id} className="database-option">
                          <div className="option-content">
                            <span className="option-icon">📊</span>
                            <div>
                              <h3>{db.title}</h3>
                              <p className="database-id">{db.id}</p>
                            </div>
                          </div>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleSelectExistingDatabase(db.id)}
                            disabled={loading}
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="onboarding-step">
            <div className="success-animation">
              <span className="success-icon">🎉</span>
            </div>

            <h2>All Set!</h2>
            <p className="onboarding-description">
              Your Notion integration is ready. Every food entry you create will
              now automatically sync to your Notion database.
            </p>

            <div className="success-details">
              <div className="detail-item">
                <span className="detail-label">Database ID:</span>
                <code className="detail-value">{databaseId}</code>
              </div>
            </div>

            <div className="next-steps">
              <h3>What happens next?</h3>
              <ul>
                <li>Create food entries in the app</li>
                <li>They'll automatically appear in your Notion database</li>
                <li>Customize the database view however you like</li>
                <li>Add tags, filters, or additional properties in Notion</li>
              </ul>
            </div>

            <div className="onboarding-actions">
              <button
                className="btn btn-primary btn-large"
                onClick={handleComplete}
              >
                Start Using Winy AI
              </button>
              <button
                className="btn btn-text"
                onClick={() => window.open(`https://notion.so/${databaseId.replace(/-/g, '')}`, '_blank')}
              >
                View Database in Notion →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
