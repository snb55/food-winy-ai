/**
 * Migration Utility - Backfill fieldValues for existing entries
 * 
 * Run this from the browser console or create a one-time admin function
 * to add fieldValues to entries that don't have them.
 */

import { getDocs, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FoodEntry } from '../types';

/**
 * Migrate entries to add fieldValues if missing
 * Extracts macros from AI summary or sets defaults
 */
export async function migrateEntriesForUser(userId: string): Promise<number> {
  const entriesRef = collection(db, 'entries');
  const entriesSnapshot = await getDocs(entriesRef);
  
  let migrated = 0;
  
  for (const entryDoc of entriesSnapshot.docs) {
    const entry = { id: entryDoc.id, ...entryDoc.data() } as FoodEntry;
    
    // Skip if not for this user
    if (entry.userId !== userId) continue;
    
    // Skip if already has fieldValues
    if (entry.fieldValues && Object.keys(entry.fieldValues).length > 0) continue;
    
    // Create fieldValues from existing entry data
    const fieldValues: Record<string, any> = {
      name: entry.title || entry.text || 'Food Entry',
      date: entry.timestamp || Date.now(),
      summary: entry.aiSummary || entry.text || '',
      photo: entry.photoUrl || '',
      // Try to extract macros from AI summary
      protein: extractNumberFromText(entry.aiSummary || '', 'protein') || 0,
      carbs: extractNumberFromText(entry.aiSummary || '', 'carbs') || 0,
      fat: extractNumberFromText(entry.aiSummary || '', 'fat') || 0,
      calories: extractNumberFromText(entry.aiSummary || '', 'calories') || 0,
    };
    
    // Update entry with fieldValues
    await updateDoc(doc(db, 'entries', entry.id), {
      fieldValues,
    });
    
    migrated++;
  }
  
  return migrated;
}

/**
 * Extract number from text using regex patterns
 */
function extractNumberFromText(text: string, keyword: string): number | null {
  const patterns = [
    new RegExp(`${keyword}[\\s:]*([\\d.]+)`, 'i'),
    new RegExp(`([\\d.]+)\\s*${keyword}`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseFloat(match[1]);
      if (!isNaN(num)) return num;
    }
  }
  
  return null;
}

