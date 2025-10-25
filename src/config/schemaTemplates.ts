/**
 * Schema Templates
 * 
 * Predefined database schema configurations that users can choose from.
 * Each template defines a different tracking style for food logging.
 */

import type { FieldConfig } from '../types';

export interface SchemaTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: FieldConfig[];
  recommended?: boolean;
}

/**
 * Template 1: Simple Food Log
 * Minimal tracking - just the basics
 */
const simpleTemplate: SchemaTemplate = {
  id: 'simple',
  name: 'Simple Food Log',
  description: 'Minimal tracking - just name, date, photo, and notes',
  icon: '📝',
  recommended: true,
  fields: [
    {
      id: 'name',
      name: 'Name',
      type: 'title',
      notionPropertyType: 'title',
      required: true,
      showInForm: false, // Hidden from form - AI will extract from text
      extractFromAI: true,
      aiPromptHint: 'A brief description of what was eaten',
    },
    {
      id: 'description',
      name: 'Description',
      type: 'text',
      notionPropertyType: 'rich_text',
      required: true,
      showInForm: true,
      aiPromptHint: 'What did you eat? (e.g., "Grilled chicken salad with olive oil")',
    },
    {
      id: 'date',
      name: 'Date',
      type: 'date',
      notionPropertyType: 'date',
      required: true,
      showInForm: false, // Auto-filled with current date
    },
    {
      id: 'photo',
      name: 'Photo',
      type: 'url',
      notionPropertyType: 'url',
      required: false,
      showInForm: true,
    },
    {
      id: 'summary',
      name: 'Summary',
      type: 'text',
      notionPropertyType: 'rich_text',
      required: false,
      showInForm: false, // Auto-filled by AI
      extractFromAI: true,
      aiPromptHint: 'AI-generated nutritional insights and meal description',
    },
  ],
};

/**
 * Template 2: Macro Tracking
 * Track macronutrients and meal types
 */
const macroTemplate: SchemaTemplate = {
  id: 'macro',
  name: 'Macro Tracking',
  description: 'Track protein, carbs, fat, and calories with meal types',
  icon: '💪',
  recommended: true,
  fields: [
    {
      id: 'name',
      name: 'Name',
      type: 'title',
      notionPropertyType: 'title',
      required: true,
      showInForm: false, // Hidden from form - AI will extract from text
      extractFromAI: true,
      aiPromptHint: 'Food or meal name',
    },
    {
      id: 'description',
      name: 'Description',
      type: 'text',
      notionPropertyType: 'rich_text',
      required: true,
      showInForm: true,
      aiPromptHint: 'What did you eat? (e.g., "Grilled chicken salad with olive oil")',
    },
    {
      id: 'date',
      name: 'Date',
      type: 'date',
      notionPropertyType: 'date',
      required: true,
      showInForm: false,
    },
    {
      id: 'photo',
      name: 'Photo',
      type: 'url',
      notionPropertyType: 'url',
      required: false,
      showInForm: true,
    },
    {
      id: 'meal_type',
      name: 'Meal Type',
      type: 'select',
      notionPropertyType: 'select',
      required: false,
      showInForm: true,
      options: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
      extractFromAI: true,
      aiPromptHint: 'Type of meal: Breakfast, Lunch, Dinner, or Snack',
    },
    {
      id: 'protein',
      name: 'Protein',
      type: 'number',
      notionPropertyType: 'number',
      numberFormat: 'number',
      unit: 'g',
      required: false,
      showInForm: false, // Hide from form - AI will extract
      extractFromAI: true,
      aiPromptHint: 'Estimated grams of protein',
    },
    {
      id: 'carbs',
      name: 'Carbs',
      type: 'number',
      notionPropertyType: 'number',
      numberFormat: 'number',
      unit: 'g',
      required: false,
      showInForm: false, // Hide from form - AI will extract
      extractFromAI: true,
      aiPromptHint: 'Estimated grams of carbohydrates',
    },
    {
      id: 'fat',
      name: 'Fat',
      type: 'number',
      notionPropertyType: 'number',
      numberFormat: 'number',
      unit: 'g',
      required: false,
      showInForm: false, // Hide from form - AI will extract
      extractFromAI: true,
      aiPromptHint: 'Estimated grams of fat',
    },
    {
      id: 'calories',
      name: 'Calories',
      type: 'number',
      notionPropertyType: 'number',
      numberFormat: 'number',
      unit: 'kcal',
      required: false,
      showInForm: false, // Hide from form - AI will extract
      extractFromAI: true,
      aiPromptHint: 'Estimated total calories',
    },
    {
      id: 'summary',
      name: 'Summary',
      type: 'text',
      notionPropertyType: 'rich_text',
      required: false,
      showInForm: false,
      extractFromAI: true,
      aiPromptHint: 'AI-generated nutritional insights',
    },
  ],
};

/**
 * Template 3: Full Nutrition
 * Comprehensive nutrition tracking with all micronutrients
 */
const fullNutritionTemplate: SchemaTemplate = {
  id: 'full-nutrition',
  name: 'Full Nutrition',
  description: 'Comprehensive tracking with macros and micronutrients',
  icon: '📊',
  fields: [
    {
      id: 'name',
      name: 'Name',
      type: 'title',
      notionPropertyType: 'title',
      required: true,
      showInForm: false, // Hidden from form - AI will extract from text
      extractFromAI: true,
    },
    {
      id: 'description',
      name: 'Description',
      type: 'text',
      notionPropertyType: 'rich_text',
      required: true,
      showInForm: true,
      aiPromptHint: 'What did you eat? (e.g., "Grilled chicken salad with olive oil")',
    },
    {
      id: 'date',
      name: 'Date',
      type: 'date',
      notionPropertyType: 'date',
      required: true,
      showInForm: false,
    },
    {
      id: 'photo',
      name: 'Photo',
      type: 'url',
      notionPropertyType: 'url',
      required: false,
      showInForm: true,
    },
    {
      id: 'meal_type',
      name: 'Meal Type',
      type: 'select',
      notionPropertyType: 'select',
      required: false,
      showInForm: true,
      options: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'],
      extractFromAI: true,
    },
    {
      id: 'portion_size',
      name: 'Portion Size',
      type: 'text',
      notionPropertyType: 'rich_text',
      required: false,
      showInForm: true,
      extractFromAI: true,
      aiPromptHint: 'Serving size or portion description',
    },
    // Macronutrients
    {
      id: 'calories',
      name: 'Calories',
      type: 'number',
      notionPropertyType: 'number',
      numberFormat: 'number',
      unit: 'kcal',
      required: false,
      showInForm: false, // AI extracted
      extractFromAI: true,
    },
    {
      id: 'protein',
      name: 'Protein',
      type: 'number',
      notionPropertyType: 'number',
      numberFormat: 'number',
      unit: 'g',
      required: false,
      showInForm: false, // AI extracted
      extractFromAI: true,
    },
    {
      id: 'carbs',
      name: 'Carbs',
      type: 'number',
      notionPropertyType: 'number',
      numberFormat: 'number',
      unit: 'g',
      required: false,
      showInForm: false, // AI extracted
      extractFromAI: true,
    },
    {
      id: 'fat',
      name: 'Fat',
      type: 'number',
      notionPropertyType: 'number',
      numberFormat: 'number',
      unit: 'g',
      required: false,
      showInForm: false, // AI extracted
      extractFromAI: true,
    },
    // Micronutrients
    {
      id: 'fiber',
      name: 'Fiber',
      type: 'number',
      notionPropertyType: 'number',
      numberFormat: 'number',
      unit: 'g',
      required: false,
      showInForm: false, // AI extracted
      extractFromAI: true,
      aiPromptHint: 'Estimated grams of dietary fiber',
    },
    {
      id: 'sugar',
      name: 'Sugar',
      type: 'number',
      notionPropertyType: 'number',
      numberFormat: 'number',
      unit: 'g',
      required: false,
      showInForm: false, // AI extracted
      extractFromAI: true,
      aiPromptHint: 'Estimated grams of sugar',
    },
    {
      id: 'sodium',
      name: 'Sodium',
      type: 'number',
      notionPropertyType: 'number',
      numberFormat: 'number',
      unit: 'mg',
      required: false,
      showInForm: false, // AI extracted
      extractFromAI: true,
      aiPromptHint: 'Estimated milligrams of sodium',
    },
    {
      id: 'summary',
      name: 'Summary',
      type: 'text',
      notionPropertyType: 'rich_text',
      required: false,
      showInForm: false,
      extractFromAI: true,
    },
  ],
};

/**
 * Template 4: Minimal
 * Absolute minimum - just name, date, and photo
 */
const minimalTemplate: SchemaTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Ultra-simple tracking - just the essentials',
  icon: '✨',
  fields: [
    {
      id: 'name',
      name: 'Name',
      type: 'title',
      notionPropertyType: 'title',
      required: true,
      showInForm: false, // Hidden from form - AI will extract from text
      extractFromAI: true,
    },
    {
      id: 'description',
      name: 'Description',
      type: 'text',
      notionPropertyType: 'rich_text',
      required: true,
      showInForm: true,
      aiPromptHint: 'What did you eat? (e.g., "Grilled chicken salad with olive oil")',
    },
    {
      id: 'date',
      name: 'Date',
      type: 'date',
      notionPropertyType: 'date',
      required: true,
      showInForm: false,
    },
    {
      id: 'photo',
      name: 'Photo',
      type: 'url',
      notionPropertyType: 'url',
      required: false,
      showInForm: true,
    },
  ],
};

/**
 * All available templates
 */
export const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  simpleTemplate,
  macroTemplate,
  fullNutritionTemplate,
  minimalTemplate,
];

/**
 * Get a template by ID
 */
export function getTemplateById(templateId: string): SchemaTemplate | undefined {
  return SCHEMA_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Get the default/recommended template
 */
export function getDefaultTemplate(): SchemaTemplate {
  return SCHEMA_TEMPLATES.find((t) => t.recommended) || simpleTemplate;
}

/**
 * Create a new schema from a template
 */
export function createSchemaFromTemplate(
  templateId: string,
  userId: string,
  customName?: string
): Omit<DatabaseSchema, 'id'> {
  const template = getTemplateById(templateId);
  
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  return {
    userId,
    name: customName || template.name,
    description: template.description,
    templateId: template.id,
    fields: JSON.parse(JSON.stringify(template.fields)), // Deep clone
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Import DatabaseSchema for type checking
import type { DatabaseSchema } from '../types';

