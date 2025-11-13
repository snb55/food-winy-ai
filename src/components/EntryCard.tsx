/**
 * Entry Card Component
 *
 * Displays a single food entry with photo, text, AI summary, and timestamp.
 * Supports both legacy format and dynamic schema-based entries.
 * Minimal card design with Notion aesthetic.
 */

import { useState, useEffect } from 'react';
import type { FoodEntry, DatabaseSchema } from '../types';
import { deleteEntry, getSchema, getUserSettings } from '../services/firestore';
import { deleteNotionPage } from '../services/notion';
import { useAuth } from '../hooks/useAuth';
import './EntryCard.css';

interface EntryCardProps {
  entry: FoodEntry;
  onDelete: () => void;
}

export default function EntryCard({ entry, onDelete }: EntryCardProps) {
  const { user } = useAuth();
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(!!entry.schemaId);
  const [isExpanded, setIsExpanded] = useState(false);

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
    if (!user) return;

    try {
      // Get user settings to check if Notion is configured
      const settings = await getUserSettings(user.uid);
      const hasNotion = settings?.notionApiKey && settings?.notionDatabaseId && entry.notionPageId;

      let deleteFromNotion = false;

      // If Notion is configured, ask where to delete from
      if (hasNotion) {
        const choice = window.confirm(
          'Delete from both app and Notion?\n\n' +
          'OK = Delete from both\n' +
          'Cancel = Delete from app only (keep in Notion)'
        );
        deleteFromNotion = choice;
      } else {
        // If Notion not configured, just confirm delete
        if (!window.confirm('Delete this entry?')) return;
      }

      // FIRESTORE-FIRST: Delete from Firestore (source of truth) first
      await deleteEntry(entry.id);
      console.log('Deleted from Firestore (source of truth)');

      // If user chose to delete from Notion too, try to delete
      if (deleteFromNotion && entry.notionPageId && settings) {
        try {
          await deleteNotionPage(settings.notionApiKey!, entry.notionPageId);
          console.log('Deleted from Notion mirror');
        } catch (notionError: any) {
          console.error('Failed to delete from Notion:', notionError);
          alert('Entry deleted from app, but failed to delete from Notion. You may need to delete it manually in Notion.');
          // Entry is already deleted from Firestore, so continue
        }
      }

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

  // Extract macros (protein, carbs, fat, calories) for compact display
  const getMacros = () => {
    if (!entry.fieldValues) return null;

    const macros = {
      calories: entry.fieldValues.calories || 0,
      protein: entry.fieldValues.protein || 0,
      carbs: entry.fieldValues.carbs || 0,
      fat: entry.fieldValues.fat || 0,
    };

    // Only return if at least one macro has a value
    if (macros.calories > 0 || macros.protein > 0 || macros.carbs > 0 || macros.fat > 0) {
      return macros;
    }

    return null;
  };

  const renderMacros = () => {
    const macros = getMacros();
    if (!macros) return null;

    return (
      <div className="entry-macros">
        {macros.calories > 0 && (
          <span className="macro-item">
            <span className="macro-value">{Math.round(macros.calories)}</span>
            <span className="macro-label">kcal</span>
          </span>
        )}
        {macros.protein > 0 && (
          <span className="macro-item">
            <span className="macro-value">{Math.round(macros.protein)}g</span>
            <span className="macro-label">protein</span>
          </span>
        )}
        {macros.carbs > 0 && (
          <span className="macro-item">
            <span className="macro-value">{Math.round(macros.carbs)}g</span>
            <span className="macro-label">carbs</span>
          </span>
        )}
        {macros.fat > 0 && (
          <span className="macro-item">
            <span className="macro-value">{Math.round(macros.fat)}g</span>
            <span className="macro-label">fat</span>
          </span>
        )}
      </div>
    );
  };

  const renderDynamicFields = () => {
    if (!schema || !entry.fieldValues) return null;

    // Get fields to display (exclude photo, date, summary, name, and macros)
    const displayFields = schema.fields.filter(
      (f) => 
        f.id !== 'photo' && 
        f.id !== 'date' && 
        f.id !== 'summary' &&
        f.id !== 'name' && // Name is shown as title
        f.id !== 'protein' &&
        f.id !== 'carbs' &&
        f.id !== 'fat' &&
        f.id !== 'calories' && // Macros shown separately
        f.id !== 'meal_type' && // Meal type shown separately
        entry.fieldValues![f.id] !== undefined &&
        entry.fieldValues![f.id] !== null &&
        entry.fieldValues![f.id] !== '' &&
        entry.fieldValues![f.id] !== 0 // Don't show zero values
    );

    if (displayFields.length === 0) {
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

  // Check if dynamic fields exist (excluding macros)
  const hasOtherFields = (() => {
    if (!schema || !entry.fieldValues) return false;
    const otherFields = schema.fields.filter(
      (f) => 
        f.id !== 'photo' && 
        f.id !== 'date' && 
        f.id !== 'summary' &&
        f.id !== 'name' &&
        f.id !== 'protein' &&
        f.id !== 'carbs' &&
        f.id !== 'fat' &&
        f.id !== 'calories' &&
        entry.fieldValues![f.id] !== undefined &&
        entry.fieldValues![f.id] !== null &&
        entry.fieldValues![f.id] !== '' &&
        entry.fieldValues![f.id] !== 0
    );
    return otherFields.length > 0;
  })();

  // Check if there's expandable content
  const hasExpandableContent = summary || hasOtherFields;

  return (
    <div 
      className={`entry-card ${isExpanded ? 'expanded' : ''}`}
      onClick={hasExpandableContent ? () => setIsExpanded(!isExpanded) : undefined}
      style={hasExpandableContent ? { cursor: 'pointer' } : undefined}
    >
      {photoUrl && (
        <div className="entry-photo">
          <img src={photoUrl} alt="Food" />
        </div>
      )}

      <div className="entry-content">
        {titleText && <p className="entry-text">{titleText}</p>}

        {/* Macros displayed below title (always visible) */}
        {renderMacros()}

        {/* Expanded content (shown when clicked) */}
        {isExpanded && (
          <div className="entry-expanded">
            {/* Display other dynamic fields if using schema */}
            {hasOtherFields && renderDynamicFields()}

            {/* AI Summary in expanded section */}
            {summary && (
              <div className="entry-summary">
                <span className="summary-label">AI Summary:</span>
                <p className="summary-text">{summary}</p>
              </div>
            )}
          </div>
        )}

        <div className="entry-footer" onClick={(e) => e.stopPropagation()}>
          <span className="entry-timestamp">{formatDate(entry.timestamp)}</span>
          {schema && (
            <span className="schema-badge" title={schema.name}>
              {schema.name}
            </span>
          )}
          <div className="entry-actions">
            {hasExpandableContent && (
              <button
                className="expand-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? '▲' : '▼'}
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }} 
              className="delete-btn" 
              title="Delete entry"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
