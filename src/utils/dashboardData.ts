/**
 * Dashboard Data Utilities
 *
 * Helper functions for processing food entries into dashboard metrics:
 * - Daily macro aggregation
 * - Current day totals
 * - Streak calculation
 * - Macro field extraction
 */

import type { FoodEntry, DatabaseSchema } from '../types';

/**
 * Daily aggregated macro data for charting
 */
export interface DailyMacroData {
  date: string; // YYYY-MM-DD format
  dateLabel: string; // Short date label (e.g., "Jan 15")
  timestamp: number; // Date timestamp for sorting
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Get macro field IDs from a schema
 * Returns common macro fields if schema is null or doesn't have them
 */
export function getMacroFieldNames(schema: DatabaseSchema | null): string[] {
  if (!schema) {
    // Default macro fields
    return ['protein', 'carbs', 'fat', 'calories'];
  }

  // Extract numeric fields that look like macros
  const macroFields: string[] = [];
  const fieldIds = schema.fields
    .filter((f) => f.type === 'number')
    .map((f) => f.id.toLowerCase());

  // Check for common macro field names
  if (fieldIds.includes('protein')) macroFields.push('protein');
  if (fieldIds.includes('carbs') || fieldIds.includes('carbohydrates')) macroFields.push('carbs');
  if (fieldIds.includes('fat')) macroFields.push('fat');
  if (fieldIds.includes('calories')) macroFields.push('calories');
  if (fieldIds.includes('net_carbs') || fieldIds.includes('netcarbs')) macroFields.push('net_carbs');

  // If no macros found, use defaults
  return macroFields.length > 0 ? macroFields : ['protein', 'carbs', 'fat', 'calories'];
}

/**
 * Extract numeric value from entry fieldValues or legacy fields
 */
function getFieldValue(entry: FoodEntry, fieldId: string): number {
  // Try fieldValues first (new format)
  if (entry.fieldValues && entry.fieldValues[fieldId] !== undefined) {
    const value = entry.fieldValues[fieldId];
    // Handle string numbers too
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  // Legacy fallback: Try to extract from AI summary text if no fieldValues
  // This is a last resort - entries should ideally have fieldValues
  if (entry.aiSummary && fieldId === 'calories') {
    // Try to extract calories from AI summary text
    const calorieMatch = entry.aiSummary.match(/(\d+)\s*(?:kcal|calories?)/i);
    if (calorieMatch) {
      return parseInt(calorieMatch[1], 10);
    }
  }

  return 0;
}

/**
 * Aggregate entries by date, summing macros per day
 * Only includes dates that have actual entries (no empty dates)
 * @param entries - Array of food entries
 * @param days - Number of days to look back (default: 7) - only entries within this range are included
 * @returns Array of daily aggregated data, sorted by date (oldest first)
 */
export function aggregateDailyMacros(
  entries: FoodEntry[],
  days: number = 7
): DailyMacroData[] {
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - days);
  cutoffDate.setHours(0, 0, 0, 0);

  // Map of date strings to aggregated values
  // Only create entries for dates that have data
  const dailyMap = new Map<string, DailyMacroData>();

  // Aggregate entries - only process entries within the date range
  entries.forEach((entry) => {
    const entryDate = new Date(entry.timestamp);
    entryDate.setHours(0, 0, 0, 0);
    
    // Skip entries before cutoff or in the future
    if (entryDate.getTime() < cutoffDate.getTime() || entryDate.getTime() > now.getTime()) {
      return;
    }

    const dateKey = formatDateKey(entryDate);
    
    // Create daily entry if it doesn't exist, otherwise update it
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        dateLabel: formatDateLabel(entryDate),
        timestamp: entryDate.getTime(),
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });
    }

    const daily = dailyMap.get(dateKey)!;
    daily.calories += getFieldValue(entry, 'calories');
    daily.protein += getFieldValue(entry, 'protein');
    daily.carbs += getFieldValue(entry, 'carbs');
    daily.fat += getFieldValue(entry, 'fat');
  });

  // Convert map to array and sort by date
  // Only return dates that have at least some data
  const result = Array.from(dailyMap.values())
    .filter((daily) => daily.calories > 0 || daily.protein > 0 || daily.carbs > 0 || daily.fat > 0)
    .sort((a, b) => a.timestamp - b.timestamp);
  
  console.log('aggregateDailyMacros - input entries:', entries.length);
  console.log('aggregateDailyMacros - dailyMap size:', dailyMap.size);
  console.log('aggregateDailyMacros - filtered result:', result.length);
  if (result.length === 0 && entries.length > 0) {
    console.log('No macro data found in entries. Sample entry:', entries[0]);
    if (entries[0]?.fieldValues) {
      console.log('Entry fieldValues:', entries[0].fieldValues);
      console.log('Checking macro fields:', {
        calories: getFieldValue(entries[0], 'calories'),
        protein: getFieldValue(entries[0], 'protein'),
        carbs: getFieldValue(entries[0], 'carbs'),
        fat: getFieldValue(entries[0], 'fat'),
      });
    }
  }
  
  return result;
}

/**
 * Get current day's total for a specific field
 * @param entries - Array of food entries
 * @param fieldId - Field to sum (e.g., 'protein', 'calories')
 * @returns Total value for today
 */
export function getCurrentDayTotal(entries: FoodEntry[], fieldId: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let total = 0;

  entries.forEach((entry) => {
    const entryDate = new Date(entry.timestamp);
    entryDate.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === today.getTime()) {
      total += getFieldValue(entry, fieldId);
    }
  });

  return total;
}

/**
 * Get calorie limit from settings (with default fallback)
 * @param calorieLimit - Calorie limit from settings
 * @returns Calorie limit value or 0 if not set
 */
export function getCalorieLimit(calorieLimit?: number): number {
  return calorieLimit || 0;
}

/**
 * Calculate consecutive days streak for reaching goal
 * @param entries - Array of food entries
 * @param goalField - Field to check (e.g., 'protein')
 * @param goalValue - Target value to reach
 * @returns Number of consecutive days goal was met (including today if met)
 */
export function calculateStreak(
  entries: FoodEntry[],
  goalField: string,
  goalValue: number
): number {
  if (goalValue <= 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Aggregate daily totals
  const dailyTotals = new Map<string, number>();

  entries.forEach((entry) => {
    const entryDate = new Date(entry.timestamp);
    entryDate.setHours(0, 0, 0, 0);
    
    // Only count entries from today backwards
    if (entryDate.getTime() > today.getTime()) return;

    const dateKey = formatDateKey(entryDate);
    const current = dailyTotals.get(dateKey) || 0;
    dailyTotals.set(dateKey, current + getFieldValue(entry, goalField));
  });

  // Check consecutive days backwards from today
  let streak = 0;
  let checkDate = new Date(today);

  while (true) {
    const dateKey = formatDateKey(checkDate);
    const total = dailyTotals.get(dateKey) || 0;

    if (total >= goalValue) {
      streak++;
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate consecutive days streak for reaching calorie limit
 * @param entries - Array of food entries
 * @param calorieLimit - Target calories to not exceed
 * @returns Number of consecutive days calorie limit was not exceeded (including today if met)
 */
export function calculateCalorieStreak(
  entries: FoodEntry[],
  calorieLimit: number
): number {
  if (calorieLimit <= 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Aggregate daily totals
  const dailyTotals = new Map<string, number>();

  entries.forEach((entry) => {
    const entryDate = new Date(entry.timestamp);
    entryDate.setHours(0, 0, 0, 0);
    
    // Only count entries from today backwards
    if (entryDate.getTime() > today.getTime()) return;

    const dateKey = formatDateKey(entryDate);
    const current = dailyTotals.get(dateKey) || 0;
    dailyTotals.set(dateKey, current + getFieldValue(entry, 'calories'));
  });

  // Check consecutive days backwards from today
  // For calorie limit, we check if total is LESS than or equal to limit (opposite of goals)
  let streak = 0;
  let checkDate = new Date(today);

  while (true) {
    const dateKey = formatDateKey(checkDate);
    const total = dailyTotals.get(dateKey) || 0;

    if (total <= calorieLimit) {
      streak++;
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Format date as YYYY-MM-DD key
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date as short label for display
 * e.g., "Jan 15", "Dec 3"
 */
function formatDateLabel(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

