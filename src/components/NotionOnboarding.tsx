/**
 * Notion Onboarding Component
 *
 * Guided wizard to help users set up Notion integration easily.
 * Can automatically create a database or let users choose an existing one.
 */

import { useState } from 'react';
import {
  verifyNotionConnection,
  listUserDatabases,
  createFoodLogDatabase,
  type NotionDatabase
} from '../services/notion';
import { createSchemaFromTemplate } from '../config/schemaTemplates';
import { createSchema } from '../services/firestore';
import SchemaSelector from './SchemaSelector';
import './NotionOnboarding.css';

interface NotionOnboardingProps {
  onComplete: (apiKey: string, databaseId: string, schemaId: string) => void;
  onCancel: () => void;
  userId: string;
}

type Step = 'intro' | 'select-schema' | 'api-key' | 'choose-database' | 'create-database' | 'success';

export default function NotionOnboarding({ onComplete, onCancel, userId }: NotionOnboardingProps) {
  const [step, setStep] = useState<Step>('intro');
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [schemaId, setSchemaId] = useState('');
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApiKeySubmit = async () => {
    // Get the value directly from the input field as a fallback
    const inputElement = document.getElementById('apiKey') as HTMLInputElement;
    const actualApiKey = apiKey.trim() || inputElement?.value.trim() || '';
    
    console.log('API Key length:', actualApiKey.length); // Debug log
    
    if (!actualApiKey) {
      setError('Please enter your Notion API key');
      return;
    }

    // Update state with the actual value
    setApiKey(actualApiKey);
    setLoading(true);
    setError('');

    try {
      // Verify the API key by listing databases
      const userDatabases = await listUserDatabases(actualApiKey);
      setDatabases(userDatabases);
      setStep('choose-database');
    } catch (err: any) {
      setError(err.message || 'Invalid API key. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchemaSelect = async (templateId: string) => {
    setLoading(true);
    setError('');

    try {
      // Create schema from template
      const schemaData = createSchemaFromTemplate(templateId, userId);
      const createdSchema = await createSchema(schemaData);
      setSchemaId(createdSchema.id);
      setStep('api-key');
    } catch (err: any) {
      console.error('Schema creation error:', err);
      setError(err.message || 'Failed to create schema');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSchema = () => {
    // TODO: Implement custom schema editor in Phase 2
    setError('Custom schema editor coming soon! Please select a template for now.');
  };

  const handleCreateNewDatabase = async () => {
    setLoading(true);
    setError('');

    try {
      // Get the first available page as parent (if any databases exist, use the first one's parent)
      let parentPageId: string | undefined = undefined;
      
      if (databases.length > 0) {
        // Use an existing page as parent
        parentPageId = databases[0].id;
      }
      
      const newDatabaseId = await createFoodLogDatabase(apiKey, parentPageId, schemaId);
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
            <SchemaSelector
              onSelect={handleSchemaSelect}
              onCustom={handleCustomSchema}
              onBack={() => setStep('intro')}
            />
            {error && <div className="error-message">{error}</div>}
            {loading && <div className="loading-message">Creating schema...</div>}
          </div>
        )}

        {/* API Key Step */}
        {step === 'api-key' && (
          <div className="onboarding-step">
            <button className="back-btn" onClick={() => setStep('select-schema')}>
              ← Back
            </button>

            <h2>Connect Your Notion Account</h2>
            <p className="onboarding-description">
              First, we need an API key to connect to your Notion workspace.
            </p>

            <div className="onboarding-instructions">
              <h3>Quick Setup (2 minutes):</h3>
              <ol>
                <li>
                  Click the button below to open Notion integrations
                </li>
                <li>
                  Click <strong>"New integration"</strong>
                </li>
                <li>
                  Name it <strong>"Winy AI Food"</strong>
                </li>
                <li>
                  Select your workspace and click <strong>"Submit"</strong>
                </li>
                <li>
                  Copy the <strong>"Internal Integration Token"</strong> and paste it below
                </li>
              </ol>

              <button
                className="btn btn-secondary"
                onClick={() => window.open('https://www.notion.so/my-integrations', '_blank')}
              >
                Open Notion Integrations →
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="apiKey">Notion API Key</label>
              <input
                type="text"
                id="apiKey"
                value={apiKey}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log('Input changed, length:', newValue.length); // Debug log
                  setApiKey(newValue);
                  setError('');
                }}
                onBlur={(e) => {
                  console.log('Input blur, value:', e.target.value); // Debug log
                }}
                placeholder="ntn_..."
                className="input"
                autoComplete="off"
                autoFocus
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="onboarding-actions">
              <button
                className="btn btn-primary btn-large"
                onClick={handleApiKeySubmit}
                disabled={loading || !apiKey.trim()}
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Choose Database Step */}
        {step === 'choose-database' && (
          <div className="onboarding-step">
            <button className="back-btn" onClick={() => setStep('api-key')}>
              ← Back
            </button>

            <h2>Choose Where to Create Database</h2>
            <p className="onboarding-description">
              {databases.length > 0 
                ? 'Select a page where we can create your Food Log database.'
                : 'You need to create and share a page with your integration first.'}
            </p>

            {databases.length === 0 ? (
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
                  <div className="option-content">
                    <span className="option-icon">✨</span>
                    <div>
                      <h3>Create New Database</h3>
                      <p>We'll create it inside one of your shared pages</p>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateNewDatabase}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create for Me'}
                  </button>
                </div>

                {/* Existing Databases */}
                {databases.length > 0 && (
                  <>
                    <div className="option-divider">
                      <span>or choose existing</span>
                    </div>

                    <div className="existing-databases">
                      {databases.map((db) => (
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
