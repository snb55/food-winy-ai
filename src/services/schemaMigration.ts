/**
 * Schema Migration Service
 * 
 * Handles migration of existing schemas to new simplified form structure.
 * Updates schemas to hide name field and add description field.
 */

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getUserSchemas } from './firestore';
import type { DatabaseSchema, FieldConfig } from '../types';

/**
 * Migrate a schema to the new simplified form structure
 */
export async function migrateSchemaToSimplifiedForm(schemaId: string): Promise<DatabaseSchema | null> {
  try {
    console.log('Migrating schema:', schemaId);
    
    // Get the current schema
    const schemaRef = doc(db, 'schemas', schemaId);
    const schemaDoc = await getDoc(schemaRef);
    
    if (!schemaDoc.exists()) {
      console.error('Schema not found:', schemaId);
      return null;
    }
    
    const schema = schemaDoc.data() as DatabaseSchema;
    console.log('Current schema fields:', schema.fields.map(f => ({ id: f.id, name: f.name, showInForm: f.showInForm })));
    
    // Check if already migrated
    const hasDescriptionField = schema.fields.some(f => f.id === 'description');
    const nameField = schema.fields.find(f => f.id === 'name');
    const nameFieldHidden = nameField && !nameField.showInForm;
    
    if (hasDescriptionField && nameFieldHidden) {
      console.log('Schema already migrated');
      return schema;
    }
    
    // Create updated fields
    const updatedFields: FieldConfig[] = [];
    
    for (const field of schema.fields) {
      if (field.id === 'name') {
        // Hide the name field - AI will extract it
        updatedFields.push({
          ...field,
          showInForm: false,
        });
      } else if (field.id === 'description') {
        // Keep existing description field if it exists
        updatedFields.push(field);
      } else {
        // Keep other fields as-is
        updatedFields.push(field);
      }
    }
    
    // Add description field if it doesn't exist
    if (!hasDescriptionField) {
      const descriptionField: FieldConfig = {
        id: 'description',
        name: 'Description',
        type: 'text',
        notionPropertyType: 'rich_text',
        required: true,
        showInForm: true,
        aiPromptHint: 'What did you eat? (e.g., "Grilled chicken salad with olive oil")',
      };
      
      // Insert description field after name field
      const nameIndex = updatedFields.findIndex(f => f.id === 'name');
      if (nameIndex >= 0) {
        updatedFields.splice(nameIndex + 1, 0, descriptionField);
      } else {
        updatedFields.unshift(descriptionField);
      }
    }
    
    console.log('Updated schema fields:', updatedFields.map(f => ({ id: f.id, name: f.name, showInForm: f.showInForm })));
    
    // Update the schema in Firestore
    await updateDoc(schemaRef, {
      fields: updatedFields,
      updatedAt: Date.now(),
    });
    
    console.log('Schema migration completed');
    
    return {
      ...schema,
      fields: updatedFields,
      updatedAt: Date.now(),
    };
    
  } catch (error) {
    console.error('Error migrating schema:', error);
    return null;
  }
}

/**
 * Migrate all schemas for a user
 */
export async function migrateUserSchemas(userId: string): Promise<void> {
  try {
    console.log('Migrating schemas for user:', userId);
    
    // Get all schemas for the user
    const schemas = await getUserSchemas(userId);
    
    console.log(`Found ${schemas.length} schemas to migrate`);
    
    // Migrate each schema
    for (const schema of schemas) {
      await migrateSchemaToSimplifiedForm(schema.id);
    }
    
    console.log('All schemas migrated successfully');
    
  } catch (error) {
    console.error('Error migrating user schemas:', error);
  }
}
