/**
 * Feed Page Component
 *
 * Main dashboard displaying all food entries.
 * Shows photo thumbnails, text, timestamps, and AI summaries.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserEntries, getActiveSchema, getUserSettings, createEntry, updateEntry } from '../services/firestore';
import { queryNotionEntries } from '../services/notion';
import type { FoodEntry, DatabaseSchema, UserSettings } from '../types';
import { useAuth } from '../hooks/useAuth';
import AddEntryModal from '../components/AddEntryModal';
import EntryCard from '../components/EntryCard';
import Dashboard from '../components/Dashboard';
import './Feed.css';

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Reload data when returning from Settings page (in case Notion was disconnected)
  useEffect(() => {
    if (!user) {
      // Clear entries if user logs out
      setEntries([]);
      return;
    }

    loadData();
  }, [user, location.pathname]); // Reload when pathname changes (e.g., coming back from Settings)

  // CRITICAL SAFETY: Clear entries immediately when Notion is disconnected
  useEffect(() => {
    if (settings) {
      const hasNotion = !!(settings.notionApiKey && settings.notionDatabaseId);
      console.log('🔍 Notion status check:', { 
        hasNotion, 
        entriesCount: entries.length,
        notionApiKey: !!settings.notionApiKey,
        notionDatabaseId: !!settings.notionDatabaseId
      });
      
      if (!hasNotion) {
        // CRITICAL: If Notion is disconnected, entries MUST be empty IMMEDIATELY
        if (entries.length > 0) {
          console.error('🚨 CRITICAL: Notion disconnected - clearing ALL entries immediately!', {
            entriesCount: entries.length,
            sampleEntry: entries[0] ? {
              id: entries[0].id,
              notionPageId: entries[0].notionPageId,
              title: entries[0].title || entries[0].text
            } : null
          });
          setEntries([]);
        }
      } else {
        // If Notion is configured, verify all displayed entries have notionPageId
        const entriesWithoutNotionId = entries.filter(e => !e.notionPageId);
        if (entriesWithoutNotionId.length > 0) {
          console.error('🚨 CRITICAL: Found entries without notionPageId after Notion config detected!', {
            count: entriesWithoutNotionId.length,
            entries: entriesWithoutNotionId.map(e => ({ id: e.id, title: e.title || e.text }))
          });
          // Immediately filter them out
          const validEntries = entries.filter(e => e.notionPageId);
          console.log('🧹 Auto-cleaning: Removing', entriesWithoutNotionId.length, 'invalid entries');
          setEntries(validEntries);
        }
      }
    }
  }, [settings?.notionApiKey, settings?.notionDatabaseId]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load schema and settings first
      const [activeSchema, userSettings] = await Promise.all([
        getActiveSchema(user.uid),
        getUserSettings(user.uid),
      ]);

      console.log('Loaded schema:', activeSchema);
      console.log('Loaded settings:', userSettings);

      setSchema(activeSchema);
      setSettings(userSettings);

      // CRITICAL: Check if Notion is disconnected FIRST and clear entries immediately
      const hasNotion = !!(userSettings?.notionApiKey && userSettings?.notionDatabaseId);
      if (!hasNotion) {
        console.log('🚨 Notion disconnected - clearing entries immediately at loadData');
        setEntries([]);
        setLoading(false);
        return; // Exit early - don't load anything
      }

      // NOTION-FIRST: If Notion is connected, load from Notion (source of truth)
      if (userSettings?.notionApiKey && userSettings?.notionDatabaseId) {
        // IMMEDIATELY clear entries to prevent showing old Firestore data
        console.log('Notion is configured - clearing any existing entries first');
        setEntries([]);
        
        try {
          console.log('Loading entries from Notion (source of truth)...');
          console.log('Notion Database ID:', userSettings.notionDatabaseId);
          console.log('Notion API Key present:', !!userSettings.notionApiKey);
          
          const notionEntries = await queryNotionEntries(
            userSettings.notionApiKey,
            userSettings.notionDatabaseId,
            activeSchema
          );
          
          console.log('✅ Loaded entries from Notion:', notionEntries.length, 'entries');
          if (notionEntries.length > 0) {
            console.log('Sample Notion entry:', notionEntries[0]);
          } else {
            console.log('⚠️ Notion database is empty - no entries found');
          }

          // Verify all entries have notionPageId before displaying
          const validNotionEntries = notionEntries.filter(e => {
            if (!e.notionPageId) {
              console.error('❌ Invalid: Entry from Notion missing notionPageId:', e);
              return false;
            }
            return true;
          });

          console.log('✅ Valid Notion entries:', validNotionEntries.length, 'of', notionEntries.length);

          // Sync Notion entries to Firestore cache (upsert by notionPageId)
          // We sync to cache, but we DISPLAY from Notion results
          for (const notionEntry of validNotionEntries) {
            try {
              // Check if entry already exists in Firestore by notionPageId
              const existingEntries = await getUserEntries(user.uid);
              const existing = existingEntries.find(
                (e) => e.notionPageId === notionEntry.notionPageId
              );

              const entryData = {
                ...notionEntry,
                userId: user.uid,
                schemaId: activeSchema?.id,
              };

              if (existing) {
                // Update existing entry in Firestore cache
                await updateEntry(existing.id, entryData);
                // Update the ID in our display list
                notionEntry.id = existing.id;
              } else {
                // Create new entry in Firestore cache
                const created = await createEntry(entryData);
                // Update the ID in our display list
                notionEntry.id = created.id;
              }
            } catch (syncError) {
              console.error('Error syncing entry to Firestore cache:', syncError);
              // Continue even if cache sync fails - Notion is source of truth
            }
          }

          // NOTION IS SOURCE OF TRUTH: Only show entries from Notion
          // Don't show legacy Firestore entries that aren't in Notion
          console.log('🔒 Setting entries to Notion results ONLY (no Firestore entries)', {
            count: validNotionEntries.length,
            sample: validNotionEntries[0] ? {
              id: validNotionEntries[0].id,
              notionPageId: validNotionEntries[0].notionPageId,
              hasTitle: !!(validNotionEntries[0].title || validNotionEntries[0].text)
            } : null
          });
          setEntries(validNotionEntries);
          
          // Clean up: Remove any Firestore entries that don't have a notionPageId 
          // (they're orphaned legacy entries that should not be shown)
          if (notionEntries.length === 0) {
            console.log('ℹ️ No entries in Notion database. Showing empty state.');
          } else {
            // Verify all entries have notionPageId
            const entriesWithoutNotionId = notionEntries.filter(e => !e.notionPageId);
            if (entriesWithoutNotionId.length > 0) {
              console.warn('⚠️ Warning: Some entries from Notion are missing notionPageId:', entriesWithoutNotionId);
            }
          }
        } catch (notionError: any) {
          console.error('❌ Failed to load from Notion:', notionError);
          console.error('Error details:', {
            message: notionError.message,
            code: notionError.code,
            stack: notionError.stack
          });
          // NOTION IS SOURCE OF TRUTH: Don't fall back to Firestore
          // If Notion fails, show empty state and error message
          setEntries([]);
          console.log('Entries cleared - showing empty state due to Notion error');
          alert(`Failed to load entries from Notion: ${notionError.message}\n\nPlease check your Notion API key and database ID in Settings.`);
        }
      } else {
        // NOTION-FIRST: If Notion is disconnected, show empty state
        // Firestore is just a cache, not a source of truth
        console.log('Notion not configured - showing empty state (Notion is source of truth)');
        console.log('To see entries, connect your Notion database in Settings');
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async () => {
    if (!user) return;

    try {
      const userSettings = await getUserSettings(user.uid);
      const activeSchema = await getActiveSchema(user.uid);

      // Reload schema
      setSchema(activeSchema);

      // NOTION-FIRST: Load from Notion if connected
      if (userSettings?.notionApiKey && userSettings?.notionDatabaseId) {
        // IMMEDIATELY clear entries
        console.log('Reloading: Notion configured - clearing entries first');
        setEntries([]);
        
        try {
          const notionEntries = await queryNotionEntries(
            userSettings.notionApiKey,
            userSettings.notionDatabaseId,
            activeSchema
          );
          
          console.log('✅ Reloaded entries from Notion:', notionEntries.length);

          // Sync to Firestore cache
          for (const notionEntry of notionEntries) {
            if (notionEntry.notionPageId) {
              const existingEntries = await getUserEntries(user.uid);
              const existing = existingEntries.find(
                (e) => e.notionPageId === notionEntry.notionPageId
              );

              const entryData = {
                ...notionEntry,
                userId: user.uid,
                schemaId: activeSchema?.id,
              };

              if (existing) {
                await updateEntry(existing.id, entryData);
              } else {
                await createEntry(entryData);
              }
            }
          }

          // NOTION IS SOURCE OF TRUTH: Only show entries from Notion
          console.log('Setting entries to Notion results only');
          setEntries(notionEntries);
        } catch (notionError: any) {
          console.error('❌ Failed to reload from Notion:', notionError);
          // NOTION IS SOURCE OF TRUTH: Don't fall back to Firestore
          // Show empty state if Notion fails
          setEntries([]);
          console.log('Entries cleared - showing empty state due to Notion error');
        }
      } else {
        // NOTION-FIRST: If Notion is disconnected, show empty state
        console.log('Reload: Notion not configured - showing empty state');
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const handleEntryAdded = async () => {
    setShowAddModal(false);
    await loadEntries(); // Ensure entries are reloaded before continuing
  };

  return (
    <div className="feed-container">
      {/* Header */}
      <header className="feed-header">
        <div className="header-left">
          <img src="/favicon.png" alt="logo" className="header-logo" />
          <h1>Food</h1>
        </div>

        <div className="header-right">
          <button
            onClick={() => navigate('/settings')}
            className="settings-btn"
            title="Settings"
          >
            Settings
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="feed-main">
        {/* Dashboard */}
        {!loading && <Dashboard entries={entries} schema={schema} settings={settings} />}

        {/* New Entry Button */}
        <div className="feed-actions">
          <button
            onClick={() => setShowAddModal(true)}
            className="new-entry-btn"
          >
            New Entry
          </button>
        </div>

        {/* Entries Grid */}
        {loading ? (
          <div className="loading">Loading entries...</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            {settings?.notionApiKey && settings?.notionDatabaseId ? (
              <>
                <p>No entries in your Notion database yet.</p>
                <p className="empty-subtitle">
                  Click "New Entry" to log your first meal! It will be saved to Notion.
                </p>
              </>
            ) : (
              <>
                <p>Connect Notion to start logging meals.</p>
                <p className="empty-subtitle">
                  Your food entries will be saved directly to your Notion database.
                  <br />
                  <button
                    onClick={() => navigate('/settings')}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      background: '#000',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Go to Settings
                  </button>
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="entries-grid">
            {(() => {
              // STRICT FILTER: When Notion is configured, ONLY show entries with notionPageId
              const filteredEntries = entries.filter((entry) => {
                if (settings?.notionApiKey && settings?.notionDatabaseId) {
                  const hasNotionId = !!entry.notionPageId;
                  if (!hasNotionId) {
                    console.warn('🚫 BLOCKED: Entry without notionPageId (legacy Firestore entry):', {
                      id: entry.id,
                      title: entry.title || entry.text || 'No title',
                      timestamp: entry.timestamp
                    });
                    return false;
                  }
                  // Double-check: entry came from Notion
                  return true;
                }
                return true;
              });

              // Log filtered results
              if (settings?.notionApiKey && settings?.notionDatabaseId) {
                console.log('📊 Entry Filter Results:', {
                  totalEntries: entries.length,
                  filteredEntries: filteredEntries.length,
                  blockedEntries: entries.length - filteredEntries.length,
                  entriesWithNotionId: entries.filter(e => e.notionPageId).length
                });
              }

              return filteredEntries.map((entry) => (
                <EntryCard key={entry.id || entry.notionPageId} entry={entry} onDelete={loadEntries} />
              ));
            })()}
          </div>
        )}
      </main>

      {/* Add Entry Modal */}
      {showAddModal && (
        <AddEntryModal
          onClose={() => setShowAddModal(false)}
          onEntryAdded={handleEntryAdded}
        />
      )}
    </div>
  );
}
