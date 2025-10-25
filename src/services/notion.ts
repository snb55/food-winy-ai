/**
 * Notion API Service
 *
 * Handles synchronization of food entries to a connected Notion database.
 * Users must provide their own Notion API key and database ID in settings.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../config/firebase';
import type { FoodEntry } from '../types';

/**
 * Sync a food entry to Notion database
 * @param entry - The food entry to sync
 * @param notionApiKey - User's Notion integration token
 * @param databaseId - Target Notion database ID
 * @param schemaId - Optional schema ID to use for syncing
 * @returns The ID of the created Notion page
 */
export async function syncEntryToNotion(
  entry: FoodEntry,
  notionApiKey: string,
  databaseId: string,
  schemaId?: string
): Promise<string> {
  if (!notionApiKey || !databaseId) {
    throw new Error('Notion API key and database ID are required');
  }

  try {
    // Use Firebase Cloud Function to bypass CORS
    const functions = getFunctions(app);
    console.log('Syncing entry to Notion via Cloud Function...');
    
    const syncEntry = httpsCallable(functions, 'notionSyncEntry');
    const result = await syncEntry({
      notionApiKey,
      databaseId,
      schemaId: schemaId || entry.schemaId, // Use provided schemaId or entry's schemaId
      entry: {
        text: entry.text,
        aiSummary: entry.aiSummary,
        timestamp: entry.timestamp,
        photoUrl: entry.photoUrl || null,
        fieldValues: entry.fieldValues || {}, // Include dynamic field values
      },
    });
    
    console.log('Notion sync result:', result);
    const data = result.data as { pageId: string };
    return data.pageId;
  } catch (error: any) {
    console.error('Error syncing to Notion:', error);
    throw new Error(error.message || 'Failed to sync entry to Notion. Please check your API key and database ID.');
  }
}

/**
 * Verify Notion connection by testing API key and database access
 * @param notionApiKey - User's Notion integration token
 * @param databaseId - Target Notion database ID
 * @returns True if connection is valid
 */
export async function verifyNotionConnection(
  notionApiKey: string,
  databaseId: string
): Promise<boolean> {
  if (!notionApiKey || !databaseId) {
    return false;
  }

  try {
    const functions = getFunctions(app);
    const verifyConnection = httpsCallable(functions, 'notionVerifyConnection');
    const result = await verifyConnection({ notionApiKey, databaseId });
    const data = result.data as { isValid: boolean };
    return data.isValid;
  } catch (error) {
    console.error('Error verifying Notion connection:', error);
    return false;
  }
}

/**
 * Database/Page information interface
 */
export interface NotionDatabase {
  id: string;
  title: string;
  type?: string; // 'page' or 'database'
}

/**
 * List all databases the user has access to
 * @param notionApiKey - User's Notion integration token
 * @returns Array of databases with id and title
 */
export async function listUserDatabases(
  notionApiKey: string
): Promise<NotionDatabase[]> {
  if (!notionApiKey) {
    throw new Error('Notion API key is required');
  }

  try {
    // Use Firebase Cloud Function to bypass CORS
    const functions = getFunctions(app);
    console.log('Calling notionSearchDatabases with key length:', notionApiKey.length);
    console.log('Key starts with:', notionApiKey.substring(0, 10));
    
    const searchDatabases = httpsCallable(functions, 'notionSearchDatabases');
    const result = await searchDatabases({ notionApiKey: notionApiKey });
    
    console.log('Function result:', result);
    const data = result.data as { databases: NotionDatabase[] };
    return data.databases;
  } catch (error: any) {
    console.error('Error listing databases:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'Failed to list databases. Please check your API key.');
  }
}

/**
 * Create a new page to serve as parent for the database
 * @param notionApiKey - User's Notion integration token
 * @returns The created page ID
 * @deprecated - Notion internal integrations cannot create workspace-level pages
 */
/* Commented out - not supported by Notion API for internal integrations
async function createParentPage(notionApiKey: string): Promise<string> {
  try {
    const functions = getFunctions(app);
    const createPage = httpsCallable(functions, 'notionCreatePage');
    const result = await createPage({ notionApiKey });
    const data = result.data as { pageId: string };
    return data.pageId;
  } catch (error: any) {
    console.error('Error creating parent page:', error);
    throw new Error(error.message || 'Failed to create parent page');
  }
}
*/

/**
 * Create a new Food Log database with proper schema
 * @param notionApiKey - User's Notion integration token
 * @param parentPageId - Optional parent page ID (if not provided, creates a new page first)
 * @param schemaId - Schema ID to use for database structure
 * @returns The created database ID
 */
export async function createFoodLogDatabase(
  notionApiKey: string,
  parentPageId?: string,
  schemaId?: string
): Promise<string> {
  if (!notionApiKey) {
    throw new Error('Notion API key is required');
  }

  if (!parentPageId) {
    throw new Error('A parent page ID is required. Please create and share a Notion page with your integration first.');
  }

  try {
    // Use Firebase Cloud Function to create database
    const functions = getFunctions(app);
    console.log('Creating database with parent:', parentPageId, 'and schema:', schemaId);
    
    const createDatabase = httpsCallable(functions, 'notionCreateDatabase');
    const result = await createDatabase({
      notionApiKey,
      parentPageId: parentPageId,
      schemaId: schemaId,
    });
    
    console.log('Database creation result:', result);
    const data = result.data as { databaseId: string };
    return data.databaseId;
  } catch (error: any) {
    console.error('Error creating database:', error);
    throw new Error(error.message || 'Failed to create database. Make sure you have shared a page with your Notion integration.');
  }
}
