/**
 * Review Entry Modal
 *
 * Displays AI-generated entry data for user review and editing before saving.
 * Shows title, extracted fields (macros), summary, and photo preview.
 */

import React, { useState } from 'react';
import './ReviewEntryModal.css';

interface ReviewEntryModalProps {
  isOpen: boolean;
  title: string;
  summary: string;
  extractedFields: Record<string, any>;
  photoPreview?: string;
  onSave: (updatedData: {
    title: string;
    summary: string;
    extractedFields: Record<string, any>;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ReviewEntryModal: React.FC<ReviewEntryModalProps> = ({
  isOpen,
  title: initialTitle,
  summary: initialSummary,
  extractedFields: initialFields,
  photoPreview,
  onSave,
  onCancel,
  loading = false,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [extractedFields, setExtractedFields] = useState(initialFields);

  if (!isOpen) return null;

  const handleFieldChange = (fieldId: string, value: any) => {
    setExtractedFields((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSave = () => {
    onSave({
      title,
      summary,
      extractedFields,
    });
  };

  // Determine which fields to display - only show macro fields
  const MACRO_FIELDS = ['protein', 'carbs', 'fat', 'calories', 'net_carbs'];
  const displayFields = Object.entries(extractedFields).filter(
    ([key]) => MACRO_FIELDS.includes(key) && extractedFields[key] != null
  );

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-header">
          <h2>Review Entry</h2>
          <button className="close-btn" onClick={onCancel} disabled={loading}>
            ×
          </button>
        </div>

        <div className="review-content">
          {/* Photo Preview */}
          {photoPreview && (
            <div className="review-photo">
              <img src={photoPreview} alt="Entry preview" />
            </div>
          )}

          {/* Title Input */}
          <div className="review-field">
            <label htmlFor="entry-title">Name</label>
            <input
              id="entry-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry name"
              disabled={loading}
            />
          </div>

          {/* Extracted Macro Fields */}
          {displayFields.length > 0 && (
            <div className="review-macros">
              <div className="macros-grid">
                {displayFields.map(([fieldId, value]) => {
                  // Format field name for display
                  const fieldName = fieldId
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (char) => char.toUpperCase());

                  // Determine unit
                  let unit = '';
                  if (fieldId === 'calories') unit = 'kcal';
                  else if (fieldId.includes('carb') || fieldId.includes('protein') || fieldId.includes('fat')) {
                    unit = 'g';
                  }

                  return (
                    <div key={fieldId} className="macro-field">
                      <label htmlFor={`field-${fieldId}`}>
                        {fieldName}
                        {unit && <span className="unit"> ({unit})</span>}
                      </label>
                      <input
                        id={`field-${fieldId}`}
                        type="number"
                        value={value ?? ''}
                        onChange={(e) =>
                          handleFieldChange(
                            fieldId,
                            e.target.value === '' ? null : parseFloat(e.target.value)
                          )
                        }
                        placeholder="0"
                        disabled={loading}
                        step="0.1"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Textarea */}
          <div className="review-field">
            <label htmlFor="entry-summary">Summary</label>
            <textarea
              id="entry-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Nutritional summary"
              rows={4}
              disabled={loading}
            />
          </div>
        </div>

        <div className="review-actions">
          <button
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading || !title.trim()}
          >
            {loading ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewEntryModal;
