/**
 * Preset Schema Templates
 *
 * Predefined tracking templates that users can choose from during Notion onboarding.
 * Each template defines what fields are tracked and synced to Notion.
 */

import type { DatabaseSchema, FieldConfig } from '../types';

/**
 * Template IDs
 */
export const TEMPLATE_IDS = {
  MACRO_TRACKING: 'macro-tracking',
  SIMPLE_LOGGING: 'simple-logging',
  KETO_TRACKING: 'keto-tracking',
} as const;

/**
 * Macro Tracking Template
 * Tracks: Protein, Carbs, Fat, Calories
 */
const macroTrackingFields: FieldConfig[] = [
  {
    id: 'name',
    name: 'Name',
    type: 'title',
    required: true,
    showInForm: false, // AI-generated, not shown in form
    notionPropertyType: 'title',
    extractFromAI: true,
    aiPromptHint: 'A short, descriptive name for this meal (2-5 words)',
  },
  {
    id: 'date',
    name: 'Date',
    type: 'date',
    required: true,
    showInForm: false, // Auto-filled with timestamp
    notionPropertyType: 'date',
    defaultValue: Date.now(),
  },
  {
    id: 'protein',
    name: 'Protein',
    type: 'number',
    required: false,
    showInForm: false, // AI-extracted, shown in review
    notionPropertyType: 'number',
    unit: 'g',
    extractFromAI: true,
    aiPromptHint: 'Estimated grams of protein',
  },
  {
    id: 'carbs',
    name: 'Carbs',
    type: 'number',
    required: false,
    showInForm: false,
    notionPropertyType: 'number',
    unit: 'g',
    extractFromAI: true,
    aiPromptHint: 'Estimated grams of carbohydrates',
  },
  {
    id: 'fat',
    name: 'Fat',
    type: 'number',
    required: false,
    showInForm: false,
    notionPropertyType: 'number',
    unit: 'g',
    extractFromAI: true,
    aiPromptHint: 'Estimated grams of fat',
  },
  {
    id: 'calories',
    name: 'Calories',
    type: 'number',
    required: false,
    showInForm: false,
    notionPropertyType: 'number',
    unit: 'kcal',
    extractFromAI: true,
    aiPromptHint: 'Estimated total calories',
  },
  {
    id: 'summary',
    name: 'Summary',
    type: 'text',
    required: false,
    showInForm: false, // AI-generated
    notionPropertyType: 'rich_text',
    extractFromAI: true,
    aiPromptHint: 'A brief nutritional summary of the meal',
  },
  {
    id: 'photo',
    name: 'Photo',
    type: 'url',
    required: false,
    showInForm: false, // Uploaded separately
    notionPropertyType: 'url',
  },
];

/**
 * Simple Logging Template
 * Tracks: Just basic info (name, date, photo, summary) - no macros
 */
const simpleLoggingFields: FieldConfig[] = [
  {
    id: 'name',
    name: 'Name',
    type: 'title',
    required: true,
    showInForm: false,
    notionPropertyType: 'title',
    extractFromAI: true,
    aiPromptHint: 'A short, descriptive name for this meal',
  },
  {
    id: 'date',
    name: 'Date',
    type: 'date',
    required: true,
    showInForm: false,
    notionPropertyType: 'date',
    defaultValue: Date.now(),
  },
  {
    id: 'summary',
    name: 'Summary',
    type: 'text',
    required: false,
    showInForm: false,
    notionPropertyType: 'rich_text',
    extractFromAI: true,
  },
  {
    id: 'photo',
    name: 'Photo',
    type: 'url',
    required: false,
    showInForm: false,
    notionPropertyType: 'url',
  },
];

/**
 * Keto Tracking Template
 * Tracks: Net Carbs, Fat, Protein, Calories (keto-focused)
 */
const ketoTrackingFields: FieldConfig[] = [
  {
    id: 'name',
    name: 'Name',
    type: 'title',
    required: true,
    showInForm: false,
    notionPropertyType: 'title',
    extractFromAI: true,
    aiPromptHint: 'A short, descriptive name for this meal',
  },
  {
    id: 'date',
    name: 'Date',
    type: 'date',
    required: true,
    showInForm: false,
    notionPropertyType: 'date',
    defaultValue: Date.now(),
  },
  {
    id: 'net_carbs',
    name: 'Net Carbs',
    type: 'number',
    required: false,
    showInForm: false,
    notionPropertyType: 'number',
    unit: 'g',
    extractFromAI: true,
    aiPromptHint: 'Estimated net carbs (total carbs minus fiber)',
  },
  {
    id: 'fat',
    name: 'Fat',
    type: 'number',
    required: false,
    showInForm: false,
    notionPropertyType: 'number',
    unit: 'g',
    extractFromAI: true,
    aiPromptHint: 'Estimated grams of fat',
  },
  {
    id: 'protein',
    name: 'Protein',
    type: 'number',
    required: false,
    showInForm: false,
    notionPropertyType: 'number',
    unit: 'g',
    extractFromAI: true,
    aiPromptHint: 'Estimated grams of protein',
  },
  {
    id: 'calories',
    name: 'Calories',
    type: 'number',
    required: false,
    showInForm: false,
    notionPropertyType: 'number',
    unit: 'kcal',
    extractFromAI: true,
    aiPromptHint: 'Estimated total calories',
  },
  {
    id: 'summary',
    name: 'Summary',
    type: 'text',
    required: false,
    showInForm: false,
    notionPropertyType: 'rich_text',
    extractFromAI: true,
  },
  {
    id: 'photo',
    name: 'Photo',
    type: 'url',
    required: false,
    showInForm: false,
    notionPropertyType: 'url',
  },
];

/**
 * Template metadata for UI display
 */
export interface SchemaTemplate {
  id: string;
  name: string;
  description: string;
  fields: FieldConfig[];
  icon: string;
}

/**
 * All available schema templates
 */
export const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  {
    id: TEMPLATE_IDS.MACRO_TRACKING,
    name: 'Macro Tracking',
    description: 'Track protein, carbs, fat, and calories for each meal',
    fields: macroTrackingFields,
    icon: '💪',
  },
  {
    id: TEMPLATE_IDS.SIMPLE_LOGGING,
    name: 'Simple Logging',
    description: 'Basic food logging with photos and descriptions',
    fields: simpleLoggingFields,
    icon: '📝',
  },
  {
    id: TEMPLATE_IDS.KETO_TRACKING,
    name: 'Keto Tracking',
    description: 'Track net carbs, fat, and protein for ketogenic diet',
    fields: ketoTrackingFields,
    icon: '🥑',
  },
];

/**
 * Get a template by ID
 */
export function getTemplateById(templateId: string): SchemaTemplate | undefined {
  return SCHEMA_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Create a DatabaseSchema from a template
 */
export function createSchemaFromTemplate(
  templateId: string,
  userId: string
): DatabaseSchema {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  return {
    id: `${userId}_${templateId}_${Date.now()}`,
    userId,
    name: template.name,
    description: template.description,
    templateId: template.id,
    fields: template.fields,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
