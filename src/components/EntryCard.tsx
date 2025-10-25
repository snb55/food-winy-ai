/**
 * Entry Card Component
 *
 * Displays a single food entry with photo, text, AI summary, and timestamp.
 * Supports both legacy format and dynamic schema-based entries.
 * Minimal card design with Notion aesthetic.
 */

import { useState, useEffect } from 'react';
import type { FoodEntry, DatabaseSchema } from '../types';
import { deleteEntry, getSchema } from '../services/firestore';
import './EntryCard.css';

interface EntryCardProps {
  entry: FoodEntry;
  onDelete: () => void;
}

export default function EntryCard({ entry, onDelete }: EntryCardProps) {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(!!entry.schemaId);

  // Load schema if entry has one
  useEffect(() => {
    if (!entry.schemaId) {
      setLoadingSchema(false);
      return;
    }

    const loadEntrySchema = async () => {
      try {
        const entrySchema = await getSchema(entry.schemaId!);
        setSchema(entrySchema);
      } catch (err) {
        console.error('Error loading schema:', err);
      } finally {
        setLoadingSchema(false);
      }
    };

    loadEntrySchema();
  }, [entry.schemaId]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this entry?')) return;

    try {
      await deleteEntry(entry.id);
      onDelete();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  const formatFieldValue = (field: any, value: any) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (field.type) {
      case 'number':
        return `${value}${field.unit ? ' ' + field.unit : ''}`;
      
      case 'checkbox':
        return value ? '✓' : '✗';
      
      case 'multi_select':
        return Array.isArray(value) ? value.join(', ') : value;
      
      case 'url':
        if (field.id === 'photo') {
          // Photos are displayed separately
          return null;
        }
        return value;
      
      case 'date':
        // Date is shown in footer
        return null;
      
      default:
        return value;
    }
  };

  const renderDynamicFields = () => {
    if (!schema || !entry.fieldValues) return null;

    console.log('EntryCard - schema:', schema);
    console.log('EntryCard - fieldValues:', entry.fieldValues);

    // Get fields to display (exclude photo, date, and summary which are shown separately)
    const displayFields = schema.fields.filter(
      (f) => 
        f.id !== 'photo' && 
        f.id !== 'date' && 
        f.id !== 'summary' &&
        f.id !== 'name' && // Name is shown as title
        f.id !== 'meal_type' && // Meal type is shown separately
        entry.fieldValues![f.id] !== undefined &&
        entry.fieldValues![f.id] !== null &&
        entry.fieldValues![f.id] !== '' &&
        entry.fieldValues![f.id] !== 0 // Don't show zero values
    );

    console.log('EntryCard - displayFields:', displayFields);
    console.log('EntryCard - fieldValues keys:', Object.keys(entry.fieldValues || {}));
    console.log('EntryCard - fieldValues values:', entry.fieldValues);

    if (displayFields.length === 0) {
      console.log('EntryCard - No fields to display');
      return null;
    }

    return (
      <div className="entry-fields">
        {displayFields.map((field) => {
          const value = entry.fieldValues![field.id];
          const formattedValue = formatFieldValue(field, value);
          
          if (!formattedValue) return null;

          return (
            <div key={field.id} className="field-item">
              <span className="field-label">{field.name}:</span>
              <span className="field-value">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loadingSchema) {
    return (
      <div className="entry-card loading-card">
        <div className="entry-content">
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  // Get the photo URL (from fieldValues or legacy field)
  const photoUrl = entry.fieldValues?.photo || entry.photoUrl;
  
  // Get the title text (from fieldValues.name or legacy text)
  const titleText = entry.fieldValues?.name || entry.text;
  
  // Get the summary (from fieldValues or legacy aiSummary)
  const summary = entry.fieldValues?.summary || entry.aiSummary;

  return (
    <div className="entry-card">
      {photoUrl && (
        <div className="entry-photo">
          <img src={photoUrl} alt="Food" />
        </div>
      )}

      <div className="entry-content">
        {titleText && <p className="entry-text">{titleText}</p>}

        {/* Display dynamic fields if using schema */}
        {schema && renderDynamicFields()}

        {summary && (
          <div className="entry-summary">
            <span className="summary-label">AI Summary:</span>
            <p className="summary-text">{summary}</p>
          </div>
        )}

        <div className="entry-footer">
          <span className="entry-timestamp">{formatDate(entry.timestamp)}</span>
          {schema && (
            <span className="schema-badge" title={schema.name}>
              {schema.name}
            </span>
          )}
          <button onClick={handleDelete} className="delete-btn" title="Delete entry">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
