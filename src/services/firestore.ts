/**
 * Firestore Service
 *
 * Handles all Firestore database operations for food entries and user settings.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FoodEntry, UserSettings, DatabaseSchema } from '../types';

/**
 * Create a new food entry in Firestore
 * @param entry - Food entry data (without id)
 * @returns The created entry with generated ID
 */
export async function createEntry(
  entry: Omit<FoodEntry, 'id'>
): Promise<FoodEntry> {
  const docRef = await addDoc(collection(db, 'entries'), {
    ...entry,
    timestamp: entry.timestamp || Date.now(),
  });

  return { ...entry, id: docRef.id } as FoodEntry;
}

/**
 * Get all entries for a specific user
 * @param userId - The user's ID
 * @returns Array of food entries, sorted by newest first
 */
export async function getUserEntries(userId: string): Promise<FoodEntry[]> {
  const q = query(
    collection(db, 'entries'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FoodEntry[];
}

/**
 * Update an existing food entry
 * @param entryId - The entry's document ID
 * @param updates - Partial entry data to update
 */
export async function updateEntry(
  entryId: string,
  updates: Partial<FoodEntry>
): Promise<void> {
  const entryRef = doc(db, 'entries', entryId);
  await updateDoc(entryRef, updates);
}

/**
 * Delete a food entry
 * @param entryId - The entry's document ID
 */
export async function deleteEntry(entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'entries', entryId));
}

/**
 * Get user settings from Firestore
 * @param userId - The user's ID
 * @returns User settings or null if not found
 */
export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  const docRef = doc(db, 'settings', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserSettings;
  }

  return null;
}

/**
 * Save or update user settings
 * @param userId - The user's ID
 * @param settings - Settings to save
 */
export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  const docRef = doc(db, 'settings', userId);
  await setDoc(docRef, { userId, ...settings }, { merge: true });
}

// ============================================================================
// Schema Management Functions
// ============================================================================

/**
 * Create a new database schema
 * @param schema - Schema data (without id)
 * @returns The created schema with generated ID
 */
export async function createSchema(
  schema: Omit<DatabaseSchema, 'id'>
): Promise<DatabaseSchema> {
  const docRef = await addDoc(collection(db, 'schemas'), {
    ...schema,
    createdAt: schema.createdAt || Date.now(),
    updatedAt: schema.updatedAt || Date.now(),
  });

  return { ...schema, id: docRef.id } as DatabaseSchema;
}

/**
 * Get a specific schema by ID
 * @param schemaId - The schema's document ID
 * @returns The schema or null if not found
 */
export async function getSchema(schemaId: string): Promise<DatabaseSchema | null> {
  const docRef = doc(db, 'schemas', schemaId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as DatabaseSchema;
  }

  return null;
}

/**
 * Get all schemas for a specific user
 * @param userId - The user's ID
 * @returns Array of schemas, sorted by most recently updated
 */
export async function getUserSchemas(userId: string): Promise<DatabaseSchema[]> {
  const q = query(
    collection(db, 'schemas'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as DatabaseSchema[];
}

/**
 * Update an existing schema
 * @param schemaId - The schema's document ID
 * @param updates - Partial schema data to update
 */
export async function updateSchema(
  schemaId: string,
  updates: Partial<DatabaseSchema>
): Promise<void> {
  const schemaRef = doc(db, 'schemas', schemaId);
  await updateDoc(schemaRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Delete a schema
 * @param schemaId - The schema's document ID
 */
export async function deleteSchema(schemaId: string): Promise<void> {
  await deleteDoc(doc(db, 'schemas', schemaId));
}

/**
 * Get the active schema for a user
 * If no active schema is set, returns the first schema or null
 * @param userId - The user's ID
 * @returns The active schema or null if none exists
 */
export async function getActiveSchema(userId: string): Promise<DatabaseSchema | null> {
  // Get user settings to find active schema ID
  const settings = await getUserSettings(userId);
  
  if (settings?.activeSchemaId) {
    return await getSchema(settings.activeSchemaId);
  }

  // If no active schema, get the first schema for this user
  const schemas = await getUserSchemas(userId);
  return schemas.length > 0 ? schemas[0] : null;
}

/**
 * Set the active schema for a user
 * @param userId - The user's ID
 * @param schemaId - The schema ID to set as active
 */
export async function setActiveSchema(userId: string, schemaId: string): Promise<void> {
  await saveUserSettings(userId, { activeSchemaId: schemaId });
}
