/**
 * Notion API Service
 *
 * Handles synchronization of food entries to a connected Notion database.
 * Users must provide their own Notion API key and database ID in settings.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { auth } from '../config/firebase';
import type { FoodEntry, DatabaseSchema } from '../types';

/**
 * Sync a food entry to Notion database
 * @param entry - The food entry to sync
 * @param notionApiKey - User's Notion integration token
 * @param databaseId - Target Notion database ID
 * @param schema - Optional schema object to use for syncing
 * @returns The ID of the created Notion page
 */
export async function syncEntryToNotion(
  entry: FoodEntry,
  notionApiKey: string,
  databaseId: string,
  schema?: DatabaseSchema | null
): Promise<string> {
  if (!notionApiKey || !databaseId) {
    throw new Error('Notion API key and database ID are required');
  }

  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to sync to Notion. Please sign in and try again.');
  }

  try {
    // Ensure auth token is fresh
    await currentUser.getIdToken();

    console.log('Syncing to Notion with schema:', schema?.name || 'none');

    // Use Firebase Cloud Function to bypass CORS
    const functions = getFunctions(app, 'us-central1');
    console.log('Syncing entry to Notion via Cloud Function...');

    const syncEntry = httpsCallable(functions, 'notionSyncEntry');
    const result = await syncEntry({
      notionApiKey,
      databaseId,
      schema: schema, // Pass full schema object for dynamic property mapping
      entry: {
        title: entry.title,
        text: entry.text,
        aiSummary: entry.aiSummary,
        timestamp: entry.timestamp,
        photoUrl: entry.photoUrl || null,
        fieldValues: entry.fieldValues || {}, // Include dynamic field values
      },
    });

    console.log('Notion sync result:', result);
    const data = result.data as { pageId: string; url?: string };
    return data.pageId;
  } catch (error: any) {
    console.error('Error syncing to Notion:', error);

    if (error.code === 'unauthenticated' || error.message?.includes('unauthenticated')) {
      throw new Error('Authentication failed. Please try signing out and signing back in.');
    }

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
    const functions = getFunctions(app, 'us-central1');
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
  parent?: {
    type: string; // 'page_id' | 'workspace' | 'database_id'
    page_id?: string;
    workspace?: boolean;
    database_id?: string;
  };
  icon?: {
    type: 'emoji' | 'external' | 'file';
    emoji?: string;
    external?: { url: string };
    file?: { url: string; expiry_time?: string };
  } | null;
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

  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to connect Notion. Please sign in and try again.');
  }

  try {
    // Wait for the user to get their ID token to ensure auth is ready
    await currentUser.getIdToken(true); // Force refresh token
    console.log('User authenticated, got ID token');

    // Use Firebase Cloud Function to bypass CORS
    const functions = getFunctions(app, 'us-central1');
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

    // Provide more helpful error messages
    if (error.code === 'unauthenticated' || error.message?.includes('unauthenticated')) {
      throw new Error('Authentication failed. Please try signing out and signing back in.');
    }

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
 * Database column information
 */
export interface NotionDatabaseColumn {
  name: string;
  type: string;
  id: string;
}

/**
 * Database analysis result
 */
export interface NotionDatabaseAnalysis {
  databaseId: string;
  title: string;
  columns: NotionDatabaseColumn[];
}

/**
 * Analyze an existing Notion database schema
 * Returns column names and types for intelligent matching
 * @param notionApiKey - User's Notion integration token
 * @param databaseId - Database ID to analyze
 * @returns Database analysis with columns
 */
export async function analyzeDatabase(
  notionApiKey: string,
  databaseId: string
): Promise<NotionDatabaseAnalysis> {
  if (!notionApiKey || !databaseId) {
    throw new Error('Notion API key and database ID are required');
  }

  try {
    const functions = getFunctions(app, 'us-central1');
    const analyze = httpsCallable(functions, 'notionAnalyzeDatabase');
    const result = await analyze({ notionApiKey, databaseId });
    const data = result.data as NotionDatabaseAnalysis;
    return data;
  } catch (error: any) {
    console.error('Error analyzing database:', error);
    throw new Error(error.message || 'Failed to analyze database');
  }
}

/**
 * Create a new Food Log database with proper schema
 * @param notionApiKey - User's Notion integration token
 * @param parentPageId - Optional parent page ID (if not provided, creates a new page first)
 * @param schemaId - Schema ID to use for database structure
 * @returns The created database ID
 */
/**
 * Query entries from Notion database (bidirectional sync)
 * Used to pull changes made in Notion back into Firestore
 *
 * @param notionApiKey - User's Notion integration token
 * @param databaseId - Target Notion database ID
 * @param schema - Optional schema for field mapping
 * @returns Array of entries from Notion
 */
export async function queryNotionEntries(
  notionApiKey: string,
  databaseId: string,
  schema?: DatabaseSchema | null
): Promise<FoodEntry[]> {
  if (!notionApiKey || !databaseId) {
    throw new Error('Notion API key and database ID are required');
  }

  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to sync from Notion. Please sign in and try again.');
  }

  try {
    // Ensure auth token is fresh
    await currentUser.getIdToken();

    console.log('Querying entries from Notion database:', databaseId);

    // Use Firebase Cloud Function to query Notion
    const functions = getFunctions(app, 'us-central1');
    const queryDatabase = httpsCallable(functions, 'notionQueryDatabase');
    const result = await queryDatabase({
      notionApiKey,
      databaseId,
      schema,
    });

    const data = result.data as { entries: FoodEntry[] };
    return data.entries;
  } catch (error: any) {
    console.error('Error querying Notion database:', error);

    if (error.code === 'unauthenticated' || error.message?.includes('unauthenticated')) {
      throw new Error('Authentication failed. Please try signing out and signing back in.');
    }

    throw new Error(error.message || 'Failed to query Notion database. Please check your API key and database ID.');
  }
}

/**
 * Delete a page from Notion database (archive it)
 * @param notionApiKey - User's Notion integration token
 * @param pageId - Notion page ID to delete
 */
export async function deleteNotionPage(
  notionApiKey: string,
  pageId: string
): Promise<void> {
  if (!notionApiKey || !pageId) {
    throw new Error('Notion API key and page ID are required');
  }

  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to delete from Notion. Please sign in and try again.');
  }

  try {
    // Ensure auth token is fresh
    await currentUser.getIdToken();

    console.log('Deleting Notion page:', pageId);

    // Use Firebase Cloud Function to delete from Notion
    const functions = getFunctions(app, 'us-central1');
    const deletePage = httpsCallable(functions, 'notionDeletePage');
    await deletePage({
      notionApiKey,
      pageId,
    });

    console.log('Deleted Notion page:', pageId);
  } catch (error: any) {
    console.error('Error deleting Notion page:', error);

    if (error.code === 'unauthenticated' || error.message?.includes('unauthenticated')) {
      throw new Error('Authentication failed. Please try signing out and signing back in.');
    }

    throw new Error(error.message || 'Failed to delete Notion page. Please check your API key.');
  }
}

export async function createFoodLogDatabase(
  notionApiKey: string,
  parentPageId?: string,
  schema?: DatabaseSchema | null
): Promise<string> {
  if (!notionApiKey) {
    throw new Error('Notion API key is required');
  }

  if (!parentPageId) {
    throw new Error('A parent page ID is required. Please create and share a Notion page with your integration first.');
  }

  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to create a database. Please sign in and try again.');
  }

  try {
    // Ensure auth token is fresh
    await currentUser.getIdToken();

    console.log('Creating database with parent:', parentPageId, 'and schema:', schema?.name || 'default');

    // Use Firebase Cloud Function to create database
    const functions = getFunctions(app, 'us-central1');

    const createDatabase = httpsCallable(functions, 'notionCreateDatabase');
    const result = await createDatabase({
      notionApiKey,
      parentPageId: parentPageId,
      schema: schema, // Pass full schema object for dynamic column creation
    });

    console.log('Database creation result:', result);
    const data = result.data as { databaseId: string };
    return data.databaseId;
  } catch (error: any) {
    console.error('Error creating database:', error);

    if (error.code === 'unauthenticated' || error.message?.includes('unauthenticated')) {
      throw new Error('Authentication failed. Please try signing out and signing back in.');
    }

    throw new Error(error.message || 'Failed to create database. Make sure you have shared a page with your Notion integration.');
  }
}
