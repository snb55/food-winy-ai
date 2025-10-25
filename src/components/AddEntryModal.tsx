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
import { createEntry, getUserSettings, getActiveSchema } from '../services/firestore';
import { generateFoodSummary } from '../services/gemini';
import { syncEntryToNotion } from '../services/notion';
import { migrateSchemaToSimplifiedForm } from '../services/schemaMigration';
import DynamicEntryForm from './DynamicEntryForm';
import type { DatabaseSchema } from '../types';
import './AddEntryModal.css';

interface AddEntryModalProps {
  onClose: () => void;
  onEntryAdded: () => void;
}

export default function AddEntryModal({ onClose, onEntryAdded }: AddEntryModalProps) {
  const { user } = useAuth();
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [error, setError] = useState('');

  // Legacy support
  const [text, setText] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load user's active schema
  useEffect(() => {
    if (!user) return;
    
    const loadSchema = async () => {
      try {
        console.log('Loading schema for user:', user.uid);
        let activeSchema = await getActiveSchema(user.uid);
        console.log('Loaded schema:', activeSchema);
        
        // Migrate schema if needed
        if (activeSchema) {
          const migratedSchema = await migrateSchemaToSimplifiedForm(activeSchema.id);
          if (migratedSchema) {
            activeSchema = migratedSchema;
            console.log('Schema migrated successfully');
          }
        }
        
        setSchema(activeSchema);
        
        // Initialize date field
        if (activeSchema) {
          const dateField = activeSchema.fields.find(f => f.type === 'date');
          if (dateField) {
            setFieldValues({ [dateField.id]: Date.now() });
          }
        }
      } catch (err) {
        console.error('Error loading schema:', err);
        // Continue without schema (will use legacy form)
      } finally {
        setLoadingSchema(false);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleFieldValuesChange = (values: Record<string, any>) => {
    setFieldValues(values);
    // For legacy compatibility, update text if description field changes
    if (values.description) {
      setText(values.description);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields
    if (schema) {
      const requiredFields = schema.fields.filter(f => f.required);
      const missingFields = requiredFields.filter(f => {
        const value = fieldValues[f.id];
        return value === undefined || value === null || value === '';
      });

      if (missingFields.length > 0) {
        setError(`Please fill in: ${missingFields.map(f => f.name).join(', ')}`);
        return;
      }
    } else if (!text.trim() && !photoFile) {
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

        // Add photo URL to field values if schema has photo field
        if (schema) {
          const photoField = schema.fields.find(f => f.type === 'url' && f.id === 'photo');
          if (photoField) {
            fieldValues[photoField.id] = photoUrl;
          }
        }

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

      // Get text for AI summary (from description field or legacy text)
      const entryText = fieldValues.description || text;

      // Generate AI summary and extract field values
      const aiResult = await generateFoodSummary(entryText, photoBase64 || undefined, schema);

      // Merge AI-extracted fields into fieldValues
      if (schema && aiResult.extractedFields) {
        console.log('AI extracted fields:', aiResult.extractedFields);
        console.log('Schema fields that extract from AI:', schema.fields.filter(f => f.extractFromAI));
        
        Object.keys(aiResult.extractedFields).forEach(fieldId => {
          const field = schema.fields.find(f => f.id === fieldId);
          if (field && field.extractFromAI) {
            fieldValues[fieldId] = aiResult.extractedFields[fieldId];
            console.log(`Set ${fieldId} = ${aiResult.extractedFields[fieldId]}`);
          }
        });
        console.log('Final fieldValues before entry creation:', fieldValues);
      } else {
        console.log('No AI extraction - schema:', !!schema, 'extractedFields:', !!aiResult.extractedFields);
      }

      // Add AI summary to field values if schema has summary field
      if (schema) {
        const summaryField = schema.fields.find(f => f.id === 'summary');
        if (summaryField) {
          fieldValues[summaryField.id] = aiResult.summary;
        }
      }

      // For legacy compatibility
      const aiSummary = aiResult.summary;

      // Create entry in Firestore
      const entryData: any = {
        userId: user.uid,
        timestamp: fieldValues.date || Date.now(),
      };

      // Add schema-based or legacy data
      if (schema) {
        entryData.schemaId = schema.id;
        entryData.fieldValues = fieldValues;
        // Keep legacy fields for backwards compatibility
        entryData.text = entryText;
        entryData.photoUrl = photoUrl;
        entryData.aiSummary = aiSummary;
      } else {
        // Legacy format
        entryData.text = text.trim();
        entryData.photoUrl = photoUrl;
        entryData.aiSummary = aiSummary;
      }

      console.log('Creating entry with data:', entryData);
      console.log('Entry fieldValues:', entryData.fieldValues);
      const entry = await createEntry(entryData);
      console.log('Entry created successfully:', entry);
      console.log('Created entry fieldValues:', entry.fieldValues);

      // Sync to Notion if configured
      try {
        const settings = await getUserSettings(user.uid);
        if (settings?.notionApiKey && settings?.notionDatabaseId) {
          const notionPageId = await syncEntryToNotion(
            entry,
            settings.notionApiKey,
            settings.notionDatabaseId,
            schema?.id
          );
          console.log('Synced to Notion:', notionPageId);
        }
      } catch (notionError) {
        console.error('Failed to sync to Notion:', notionError);
        // Don't fail the entire operation if Notion sync fails
      }

      onEntryAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Entry</h2>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        {loadingSchema ? (
          <div className="loading-container">
            <p>Loading form...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="entry-form">
            {schema ? (
              // Dynamic form based on schema
              <DynamicEntryForm
                schema={schema}
                initialValues={fieldValues}
                onChange={handleFieldValuesChange}
                onPhotoChange={setPhotoFile}
              />
            ) : (
              // Legacy form (fallback if no schema)
              <>
                {/* Photo Preview */}
                {photoPreview && (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Preview" />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="remove-photo-btn"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Photo Upload Buttons */}
                {!photoPreview && (
                  <div className="photo-actions">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      style={{ display: 'none' }}
                    />
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
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary"
                    >
                      Upload Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="btn btn-secondary"
                    >
                      Take Photo
                    </button>
                  </div>
                )}

                {/* Text Input */}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What did you eat? (e.g., 'Grilled chicken salad with olive oil')"
                  className="text-input"
                  rows={4}
                  disabled={loading}
                />
              </>
            )}

            {error && <p className="error">{error}</p>}

            {/* Submit Button */}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Add Entry'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
