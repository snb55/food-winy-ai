/**
 * Add Entry Modal Component
 *
 * Modal for creating new food entries.
 * Supports photo upload, camera capture, text input, and AI summary generation.
 * Uses dynamic form based on user's active schema.
 */

import { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { createEntry, getUserSettings, getActiveSchema } from '../services/firestore';
import { generateFoodSummary } from '../services/gemini';
import { syncEntryToNotion } from '../services/notion';
import ReviewEntryModal from './ReviewEntryModal';
import type { DatabaseSchema } from '../types';
import './AddEntryModal.css';

interface AddEntryModalProps {
  onClose: () => void;
  onEntryAdded: () => void;
}

export default function AddEntryModal({ onClose, onEntryAdded }: AddEntryModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [text, setText] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<{
    title: string;
    summary: string;
    extractedFields: Record<string, any>;
    photoUrl: string;
  } | null>(null);
  const [savingEntry, setSavingEntry] = useState(false);

  // Load user's active schema
  useEffect(() => {
    if (!user) return;

    const loadSchema = async () => {
      try {
        const activeSchema = await getActiveSchema(user.uid);
        setSchema(activeSchema);
      } catch (err) {
        console.error('Error loading schema:', err);
      }
    };

    loadSchema();
  }, [user]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate basic input
    if (!text.trim() && !photoFile) {
      setError('Please add some text or a photo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let photoUrl = '';
      let photoBase64 = '';

      // Upload photo to Firebase Storage if provided
      if (photoFile) {
        const storageRef = ref(storage, `entries/${user.uid}/${Date.now()}_${photoFile.name}`);
        await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(storageRef);

        // Convert to base64 for Gemini AI
        const reader = new FileReader();
        photoBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
          };
          reader.readAsDataURL(photoFile);
        });
      }

      // Get text for AI analysis
      const entryText = text;

      // Generate AI summary and extract field values
      const aiResult = await generateFoodSummary(entryText, photoBase64 || undefined, schema);

      // Show review modal with AI-generated data
      setReviewData({
        title: aiResult.title,
        summary: aiResult.summary,
        extractedFields: aiResult.extractedFields,
        photoUrl,
      });
      setShowReviewModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze entry');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSave = async (updatedData: {
    title: string;
    summary: string;
    extractedFields: Record<string, any>;
  }) => {
    if (!user || !reviewData) return;

    setSavingEntry(true);
    setError('');

    try {
      // Create entry in Firestore
      const entryData: any = {
        userId: user.uid,
        timestamp: Date.now(),
        title: updatedData.title,
        text: text.trim(),
        photoUrl: reviewData.photoUrl,
        aiSummary: updatedData.summary,
      };

      // Add schema-based data if schema exists
      if (schema) {
        entryData.schemaId = schema.id;
        entryData.fieldValues = {
          name: updatedData.title,
          date: Date.now(),
          summary: updatedData.summary,
          photo: reviewData.photoUrl,
          ...updatedData.extractedFields,
        };
      }

      console.log('Creating entry with data:', entryData);
      const entry = await createEntry(entryData);
      console.log('Entry created successfully:', entry);

      // Sync to Notion if configured
      try {
        const settings = await getUserSettings(user.uid);
        if (settings?.notionApiKey && settings?.notionDatabaseId) {
          console.log('Syncing to Notion with schema:', schema?.id);
          console.log('Entry data:', entry);
          const notionPageId = await syncEntryToNotion(
            entry,
            settings.notionApiKey,
            settings.notionDatabaseId,
            schema
          );
          console.log('Synced to Notion:', notionPageId);
          showToast('Entry saved and synced to Notion!', 'success');
        } else {
          console.log('Notion not configured, skipping sync');
          showToast('Entry saved successfully!', 'success');
        }
      } catch (notionError: any) {
        console.error('Failed to sync to Notion:', notionError);
        showToast('Entry saved, but Notion sync failed', 'error');
        setError(`Entry saved to app, but Notion sync failed: ${notionError.message || 'Unknown error'}. Check Settings.`);
        setSavingEntry(false);
        // Don't close modal so user sees the error
        return;
      }

      onEntryAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to create entry');
      setSavingEntry(false);
    }
  };

  const handleReviewCancel = () => {
    setShowReviewModal(false);
    setReviewData(null);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>New Entry</h2>
            <button onClick={onClose} className="close-btn">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="entry-form">
            {/* Photo Upload or Preview */}
            {photoPreview ? (
              <div className="photo-preview">
                <img src={photoPreview} alt="Preview" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="remove-photo-btn"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="simple-upload-area">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="simple-upload-btn"
                >
                  Add Photo
                </button>
              </div>
            )}

            {/* Description Input */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe what you ate..."
              className="description-input"
              rows={6}
              disabled={loading}
            />

            {error && <p className="error">{error}</p>}

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Analyzing...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>

      {/* Review Entry Modal */}
      {showReviewModal && reviewData && (
        <ReviewEntryModal
          isOpen={showReviewModal}
          title={reviewData.title}
          summary={reviewData.summary}
          extractedFields={reviewData.extractedFields}
          photoPreview={reviewData.photoUrl || photoPreview}
          onSave={handleReviewSave}
          onCancel={handleReviewCancel}
          loading={savingEntry}
        />
      )}
    </>
  );
}
