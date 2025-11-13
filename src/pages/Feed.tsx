/**
 * Feed Page Component
 *
 * Main dashboard displaying all food entries.
 * Shows photo thumbnails, text, timestamps, and AI summaries.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserEntries, getActiveSchema, getUserSettings, updateEntry, createEntry } from '../services/firestore';
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

  // Removed Notion disconnect safety check - Firestore is now source of truth

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

      // BIDIRECTIONAL SYNC: Load from Firestore, then sync from Notion
      try {
        console.log('Loading entries from Firestore...');
        const firestoreEntries = await getUserEntries(user.uid);

        console.log('✅ Loaded entries from Firestore:', firestoreEntries.length, 'entries');

        // If Notion is connected, sync changes from Notion to Firestore
        const hasNotion = !!(userSettings?.notionApiKey && userSettings?.notionDatabaseId);

        if (hasNotion) {
          try {
            console.log('🔄 Syncing from Notion...');
            const notionEntries = await queryNotionEntries(
              userSettings.notionApiKey!,
              userSettings.notionDatabaseId!,
              activeSchema
            );

            console.log('✅ Loaded from Notion:', notionEntries.length, 'entries');

            // Merge Notion entries into Firestore
            for (const notionEntry of notionEntries) {
              if (!notionEntry.notionPageId) continue;

              // Find matching Firestore entry by notionPageId
              const existingEntry = firestoreEntries.find(
                e => e.notionPageId === notionEntry.notionPageId
              );

              const entryData = {
                ...notionEntry,
                userId: user.uid,
                schemaId: activeSchema?.id,
              };

              if (existingEntry) {
                // Update existing entry with Notion changes
                await updateEntry(existingEntry.id, entryData);
                console.log('Updated entry from Notion:', existingEntry.id);
              } else {
                // Create new entry from Notion
                const created = await createEntry(entryData);
                console.log('Created new entry from Notion:', created.id);
              }
            }

            // Reload from Firestore after sync
            const updatedEntries = await getUserEntries(user.uid);
            setEntries(updatedEntries);
            console.log('✅ Sync complete. Total entries:', updatedEntries.length);
          } catch (notionError: any) {
            console.error('⚠️ Notion sync failed (continuing with Firestore data):', notionError);
            // Continue with Firestore data even if Notion sync fails
            setEntries(firestoreEntries);
          }
        } else {
          // No Notion connected, just use Firestore data
          setEntries(firestoreEntries);
        }
      } catch (error: any) {
        console.error('❌ Failed to load from Firestore:', error);
        setEntries([]);
        alert(`Failed to load entries: ${error.message}`);
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
      const activeSchema = await getActiveSchema(user.uid);

      // Reload schema
      setSchema(activeSchema);

      // FIRESTORE-FIRST: Load from Firestore (source of truth)
      console.log('Reloading entries from Firestore (source of truth)...');
      const firestoreEntries = await getUserEntries(user.uid);

      console.log('✅ Reloaded entries from Firestore:', firestoreEntries.length);
      setEntries(firestoreEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      setEntries([]);
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
            <p>No entries yet. Start logging to see your progress!</p>
            <p className="empty-subtitle">
              Click "New Entry" to log your first meal!
              {settings?.notionApiKey && settings?.notionDatabaseId ? (
                <> Entries will be synced to your Notion database.</>
              ) : (
                <>
                  {' '}
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
                    Connect Notion to sync entries
                  </button>
                </>
              )}
            </p>
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
