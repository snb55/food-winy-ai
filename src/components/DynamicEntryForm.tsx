/**
 * Dynamic Entry Form Component
 * 
 * Renders a form based on a database schema, allowing users to input data
 * for custom-configured fields.
 */

import { useState, useEffect } from 'react';
import type { DatabaseSchema, FieldConfig } from '../types';
import './DynamicEntryForm.css';

interface DynamicEntryFormProps {
  schema: DatabaseSchema;
  initialValues?: Record<string, any>;
  onChange: (fieldValues: Record<string, any>) => void;
  onPhotoChange?: (file: File | null) => void;
}

export default function DynamicEntryForm({
  schema,
  initialValues = {},
  onChange,
  onPhotoChange
}: DynamicEntryFormProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, any>>(initialValues);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Get fields that should be shown in the form
  const visibleFields = schema.fields.filter(field => field.showInForm);

  // Sort fields: required first, then by order in schema
  const sortedFields = [...visibleFields].sort((a, b) => {
    if (a.required && !b.required) return -1;
    if (!a.required && b.required) return 1;
    return 0;
  });

  useEffect(() => {
    // Initialize with default values from schema
    const defaults: Record<string, any> = {};
    schema.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaults[field.id] = field.defaultValue;
      }
    });
    setFieldValues({ ...defaults, ...initialValues });
  }, [schema, initialValues]);

  const handleFieldChange = (fieldId: string, value: any) => {
    const newValues = { ...fieldValues, [fieldId]: value };
    setFieldValues(newValues);
    onChange(newValues);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoChange) {
      onPhotoChange(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    if (onPhotoChange) {
      onPhotoChange(null);
    }
    setPhotoPreview(null);
    
    // Clear file input
    const photoInput = document.getElementById('photo-input') as HTMLInputElement;
    if (photoInput) {
      photoInput.value = '';
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = fieldValues[field.id] ?? '';

    switch (field.type) {
      case 'title':
      case 'text':
        return (
          <div key={field.id} className="form-group">
            <label htmlFor={field.id}>
              {field.name}
              {field.required && <span className="required">*</span>}
              {field.unit && <span className="field-unit"> ({field.unit})</span>}
            </label>
            {field.type === 'text' && field.id !== 'summary' ? (
              <textarea
                id={field.id}
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={field.aiPromptHint || `Enter ${field.name.toLowerCase()}`}
                required={field.required}
                rows={3}
                className="input"
              />
            ) : (
              <input
                type="text"
                id={field.id}
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={field.aiPromptHint || `Enter ${field.name.toLowerCase()}`}
                required={field.required}
                className="input"
              />
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="form-group">
            <label htmlFor={field.id}>
              {field.name}
              {field.required && <span className="required">*</span>}
              {field.unit && <span className="field-unit"> ({field.unit})</span>}
            </label>
            <input
              type="number"
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value ? parseFloat(e.target.value) : '')}
              placeholder={field.aiPromptHint || `Enter ${field.name.toLowerCase()}`}
              required={field.required}
              step="0.1"
              min="0"
              className="input"
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="form-group">
            <label htmlFor={field.id}>
              {field.name}
              {field.required && <span className="required">*</span>}
            </label>
            <select
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className="input select"
            >
              <option value="">Select {field.name.toLowerCase()}</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'multi_select':
        return (
          <div key={field.id} className="form-group">
            <label htmlFor={field.id}>
              {field.name}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="multi-select-options">
              {field.options?.map((option) => {
                const selectedValues = Array.isArray(value) ? value : [];
                const isChecked = selectedValues.includes(option);
                
                return (
                  <label key={option} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...selectedValues, option]
                          : selectedValues.filter(v => v !== option);
                        handleFieldChange(field.id, newValues);
                      }}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="form-group form-group-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                id={field.id}
                checked={!!value}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              />
              {field.name}
              {field.required && <span className="required">*</span>}
            </label>
          </div>
        );

      case 'url':
        // Special handling for photo field
        if (field.id === 'photo') {
          return (
            <div key={field.id} className="form-group">
              <label htmlFor="photo-input">
                {field.name}
                {field.required && <span className="required">*</span>}
              </label>
              <div className="photo-upload-area">
                {photoPreview ? (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Preview" />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="remove-photo-btn"
                    >
                      × Remove
                    </button>
                  </div>
                ) : (
                  <label htmlFor="photo-input" className="upload-label">
                    <div className="upload-text">Click to upload or take photo</div>
                    <input
                      type="file"
                      id="photo-input"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="file-input"
                    />
                  </label>
                )}
              </div>
            </div>
          );
        }
        // Regular URL field
        return (
          <div key={field.id} className="form-group">
            <label htmlFor={field.id}>
              {field.name}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              type="url"
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={`https://...`}
              required={field.required}
              className="input"
            />
          </div>
        );

      case 'date':
        // Date is usually auto-filled, but if shown in form, render it
        return (
          <div key={field.id} className="form-group">
            <label htmlFor={field.id}>
              {field.name}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              type="datetime-local"
              id={field.id}
              value={value ? new Date(value).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleFieldChange(field.id, new Date(e.target.value).getTime())}
              required={field.required}
              className="input"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dynamic-entry-form">
      {sortedFields.map(renderField)}
      
      {/* AI extraction note */}
      {schema.fields.some(f => f.extractFromAI && !f.showInForm) && (
        <div className="form-note ai-note">
          <div className="ai-icon">AI</div>
          <div>
            <strong>AI will automatically extract:</strong>
            <div className="ai-fields">
              {schema.fields
                .filter(f => f.extractFromAI && !f.showInForm)
                .map(field => (
                  <span key={field.id} className="ai-field-tag">
                    {field.name}
                    {field.unit && ` (${field.unit})`}
                  </span>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

