/**
 * Embed Data Service
 *
 * Service for fetching data for embed pages.
 * Validates tokens and loads data from Notion (source of truth).
 */

import type { FoodEntry, UserSettings, DatabaseSchema } from '../types';
import { getUserSettings, getActiveSchema } from './firestore';
import { queryNotionEntries } from './notion';
import type { ChartType } from '../utils/embedTokens';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../config/firebase';

export interface EmbedData {
  entries: FoodEntry[];
  settings: UserSettings;
  schema: DatabaseSchema | null;
}

/**
 * Fetch data for an embed page by validating token
 * @param token - Embed token
 * @param chartType - Type of chart being embedded
 * @returns Embed data including entries, settings, and schema
 */
export async function fetchEmbedData(
  token: string,
  chartType: ChartType
): Promise<EmbedData> {
  // Find user by token (lookup in Firestore)
  const userId = await findUserByToken(token, chartType);
  
  if (!userId) {
    throw new Error('Invalid embed token');
  }

  // Load user settings
  const settings = await getUserSettings(userId);
  if (!settings) {
    throw new Error('User settings not found');
  }

  // Validate that this token matches the chart type
  const tokenKey = getTokenKeyForChartType(chartType);
  if (settings.embedTokens?.[tokenKey] !== token) {
    throw new Error('Token does not match chart type');
  }

  // Load schema
  const schema = await getActiveSchema(userId);

  // Load entries from Notion (source of truth)
  let entries: FoodEntry[] = [];
  
  if (settings.notionApiKey && settings.notionDatabaseId) {
    try {
      entries = await queryNotionEntries(
        settings.notionApiKey,
        settings.notionDatabaseId,
        schema
      );
    } catch (error: any) {
      console.error('Error loading entries from Notion for embed:', error);
      // If Notion fails, return empty entries (don't fall back to Firestore)
      entries = [];
    }
  }

  return {
    entries,
    settings,
    schema,
  };
}

/**
 * Find user ID by embed token using Cloud Function
 * @param token - Embed token to search for
 * @param chartType - Chart type for the token
 * @returns User ID if found, null otherwise
 */
async function findUserByToken(
  token: string,
  chartType: ChartType
): Promise<string | null> {
  try {
    const functions = getFunctions(app, 'us-central1');
    const validateToken = httpsCallable(functions, 'validateEmbedToken');
    const result = await validateToken({ token, chartType });
    
    const data = result.data as { userId: string; valid: boolean };
    return data.valid ? data.userId : null;
  } catch (error: any) {
    console.error('Error finding user by token:', error);
    return null;
  }
}

/**
 * Map chart type to embed token key
 */
function getTokenKeyForChartType(chartType: ChartType): keyof import('../types').EmbedTokens {
  const mapping: Record<ChartType, keyof import('../types').EmbedTokens> = {
    'main-chart': 'mainChart',
    'protein-goal': 'proteinGoal',
    'calorie-limit': 'calorieLimit',
    'protein-streak': 'proteinStreak',
    'calorie-streak': 'calorieStreak',
  };
  return mapping[chartType];
}

