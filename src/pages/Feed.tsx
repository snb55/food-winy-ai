/**
 * Feed Page Component
 *
 * Main dashboard displaying all food entries.
 * Shows photo thumbnails, text, timestamps, and AI summaries.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserEntries } from '../services/firestore';
import type { FoodEntry } from '../types';
import { useAuth } from '../hooks/useAuth';
import AddEntryModal from '../components/AddEntryModal';
import EntryCard from '../components/EntryCard';
import './Feed.css';

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Loading entries for user:', user.uid);
      const userEntries = await getUserEntries(user.uid);
      console.log('Loaded entries:', userEntries);
      setEntries(userEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntryAdded = () => {
    setShowAddModal(false);
    loadEntries();
  };

  return (
    <div className="feed-container">
      {/* Header */}
      <header className="feed-header">
        <div className="header-left">
          <img src="/favicon.png" alt="logo" className="header-logo" />
          <h1>food.winy.ai</h1>
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
        <div className="feed-actions">
          <button
            onClick={() => setShowAddModal(true)}
            className="new-entry-btn"
          >
            New Entry
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading entries...</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <p>No entries yet.</p>
            <p className="empty-subtitle">
              Click "New Entry" to log your first meal!
            </p>
          </div>
        ) : (
          <div className="entries-grid">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onDelete={loadEntries} />
            ))}
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
