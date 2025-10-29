/**
 * TypeScript Type Definitions
 *
 * Centralized type definitions for the food logging app.
 */

/**
 * Field Configuration interface
 * Defines a single trackable field in the database schema
 */
export interface FieldConfig {
  id: string; // unique identifier (e.g., 'protein', 'meal_type')
  name: string; // display name (e.g., 'Protein', 'Meal Type')
  type: 'title' | 'text' | 'number' | 'select' | 'multi_select' | 'checkbox' | 'url' | 'date';
  required: boolean;
  defaultValue?: any;
  showInForm: boolean; // show in entry creation modal
  notionPropertyType: string; // maps to Notion property type
  
  // For select/multi-select
  options?: string[];
  
  // For numbers
  numberFormat?: 'number' | 'number_with_commas' | 'percent' | 'dollar';
  unit?: string; // e.g., 'grams', 'kcal', 'mg'
  
  // AI extraction
  extractFromAI?: boolean; // should Gemini try to extract this field?
  aiPromptHint?: string; // hint for AI extraction (e.g., "estimated grams of protein")
}

/**
 * Database Schema interface
 * Defines the complete structure of what a user tracks
 */
export interface DatabaseSchema {
  id: string;
  userId: string;
  name: string; // schema name (e.g., "My Macro Tracker")
  description?: string; // brief description
  templateId?: string; // if based on a template
  fields: FieldConfig[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Food Entry interface
 * Represents a single food log entry with photo, text, and AI-generated summary
 */
export interface FoodEntry {
  id: string;
  userId: string;
  schemaId?: string; // which schema was used (optional for backwards compatibility)
  timestamp: number;
  notionPageId?: string; // ID of the synced Notion page

  // AI-generated title (e.g., "Grilled Chicken Salad")
  title?: string;

  // Dynamic fields based on schema
  fieldValues?: Record<string, any>; // e.g., { name: 'Chicken Salad', protein: 25, carbs: 40 }

  // Legacy support (for existing entries)
  photoUrl?: string;
  text?: string;
  aiSummary?: string;
}

/**
 * User Settings interface
 * Stores user preferences and API keys
 */
export interface UserSettings {
  userId: string;
  notionApiKey?: string;
  notionDatabaseId?: string;
  geminiApiKey?: string;
  activeSchemaId?: string; // current schema being used
  templateId?: string; // tracking template (macro-tracking, simple-logging, etc.)
}

/**
 * Auth User interface
 * Extended user information
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
