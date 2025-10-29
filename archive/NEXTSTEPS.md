# Next Development Steps

This document outlines the remaining features to complete the AI-powered food tracking app with intelligent Notion integration.

## Phase 1: Template Selection UI

### Goal
Allow users to choose their tracking template (Macro Tracking, Simple Logging, Keto Tracking) during Notion onboarding.

### Components to Build

#### 1. NotionSchemaSelector Component
**File**: `src/components/NotionSchemaSelector.tsx`

**Purpose**: Display the three preset templates as selectable cards

**Features**:
- Visual cards for each template (Macro Tracking, Simple Logging, Keto Tracking)
- Show what fields each template tracks
- Apple-inspired design matching the app's aesthetic
- Highlight selected template
- Return selected template ID to parent component

**Template Display Example**:
```
┌─────────────────────────────────┐
│   📊 Macro Tracking             │
│                                 │
│   Tracks:                       │
│   • Protein                     │
│   • Carbs                       │
│   • Fat                         │
│   • Calories                    │
│   • Summary                     │
│                                 │
│   [✓ Select]                    │
└─────────────────────────────────┘
```

#### 2. Update NotionOnboarding Component
**File**: `src/components/NotionOnboarding.tsx`

**Changes Needed**:
1. Add template selection as **first step** in onboarding flow
2. Store selected template ID in state
3. Pass template ID to database creation
4. Create/save schema in Firestore based on selected template

**Updated Flow**:
```
Step 1: Select Template (NEW)
  ↓
Step 2: Enter Notion API Key
  ↓
Step 3: Create New or Use Existing Database
  ↓
Step 4: [If Create New] → Create database with template schema
  ↓
Step 5: [If Existing] → Analyze database & match columns
```

#### 3. Schema Creation from Template
**File**: `src/services/firestore.ts`

**New Function**: `createSchemaFromTemplate(userId, templateId)`

**Purpose**:
- Takes template ID (e.g., "macro-tracking")
- Gets template from `schemaTemplates.ts`
- Saves as user's active schema in Firestore
- Returns schema ID

**Implementation**:
```javascript
export async function createSchemaFromTemplate(
  userId: string,
  templateId: string
): Promise<string> {
  const template = SCHEMA_TEMPLATES[templateId];
  if (!template) throw new Error('Invalid template ID');

  const schemaData = {
    ...template,
    userId,
    createdAt: Date.now(),
  };

  const schemaRef = await addDoc(collection(db, 'schemas'), schemaData);

  // Set as active schema
  await updateDoc(doc(db, 'userSettings', userId), {
    activeSchemaId: schemaRef.id,
    templateId: templateId,
  });

  return schemaRef.id;
}
```

---

## Phase 2: Column Matching for Existing Databases

### Goal
Intelligently map existing Notion database columns to app schema fields, handling different column names.

### Features to Build

#### 1. Column Matching Algorithm
**File**: `src/services/notionColumnMatcher.ts` (NEW)

**Function**: `matchColumns(schemaFields, notionColumns)`

**Matching Strategy**:
```javascript
function findColumnMatch(schemaFieldName, notionColumns) {
  const fieldLower = schemaFieldName.toLowerCase();

  // 1. Exact match (case insensitive)
  let match = notionColumns.find(col =>
    col.name.toLowerCase() === fieldLower
  );
  if (match) return { column: match, confidence: 'exact' };

  // 2. Contains match (case insensitive)
  // Field contains column name OR column name contains field
  match = notionColumns.find(col => {
    const colLower = col.name.toLowerCase();
    return colLower.includes(fieldLower) || fieldLower.includes(colLower);
  });
  if (match) return { column: match, confidence: 'partial' };

  // 3. No match
  return { column: null, confidence: 'none' };
}
```

**Examples**:
- "Protein" → "Protein" (exact)
- "Protein" → "Protein (g)" (partial - contains)
- "Carbs" → "Carb" (partial - contains)
- "Date" → "When" (no match - user needs to map manually)
- "Calories" → "Cal" (partial - contains)

#### 2. Column Mapping Review UI
**File**: `src/components/NotionColumnMapper.tsx` (NEW)

**Purpose**: Show user the auto-matched columns and let them adjust if needed

**UI Design**:
```
Column Mapping

✅ Matched Columns:
  Name → Meal Name
  Protein → Protein
  Carbs → Carb (contains match)
  Fat → Fats (contains match)

⚠️  Uncertain Matches:
  Date → [Dropdown: When / Created / Date Added]
  Summary → [Dropdown: Notes / Description / Summary]

❌ No Match Found:
  Calories (will be skipped)
  Photo (will be skipped)

[ ] Add missing columns to Notion database (recommended)

[Cancel] [Save Mapping]
```

**Props**:
```typescript
interface NotionColumnMapperProps {
  schemaFields: FieldConfig[];
  notionColumns: NotionDatabaseColumn[];
  onMappingComplete: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}
```

**Output** (mapping object):
```javascript
{
  name: "Meal Name",      // schema field ID → Notion column name
  date: "When",
  protein: "Protein",
  carbs: "Carb",
  fat: "Fats",
  calories: null,         // no match - will be skipped
  summary: "Notes",
  photo: null,            // no match - will be skipped
}
```

#### 3. Store Column Mapping in UserSettings
**File**: `src/types/index.ts`

**Update UserSettings interface**:
```typescript
export interface UserSettings {
  userId: string;
  notionApiKey?: string;
  notionDatabaseId?: string;
  geminiApiKey?: string;
  activeSchemaId?: string;
  templateId?: string;

  // NEW: Column mapping for existing databases
  notionColumnMapping?: Record<string, string | null>;
  // Example: { name: "Meal Name", date: "When", calories: null }
}
```

**Purpose**:
- Persists the mapping between schema fields and Notion columns
- Used every time we sync an entry to Notion
- Allows skipping fields that have no match (null values)

#### 4. Update notionSyncEntry to Use Mapping
**File**: `functions/index.js`

**Changes to Cloud Function**:
```javascript
exports.notionSyncEntry = functions.https.onCall(async (data, context) => {
  const { notionApiKey, databaseId, entry, schema, columnMapping } = data;

  // Build Notion properties
  const properties = {};

  if (schema && schema.fields && entry.fieldValues) {
    schema.fields.forEach((field) => {
      const value = entry.fieldValues[field.id];
      if (value === undefined || value === null) return;

      // Use mapped column name if provided, otherwise use field name
      const columnName = columnMapping?.[field.id] || field.name;

      // Skip if no column name (unmapped field)
      if (!columnName) {
        console.log(`Skipping field ${field.id} - no column mapping`);
        return;
      }

      // Map field type to Notion property...
      properties[columnName] = buildNotionProperty(field, value);
    });
  }

  // Create page in Notion...
});
```

**Client-side update** (`src/services/notion.ts`):
```javascript
export async function syncEntryToNotion(
  entry: FoodEntry,
  notionApiKey: string,
  databaseId: string,
  schemaId?: string,
  columnMapping?: Record<string, string | null>  // NEW parameter
): Promise<string> {
  // ... existing code ...

  const syncEntry = httpsCallable(functions, 'notionSyncEntry');
  const result = await syncEntry({
    notionApiKey,
    databaseId,
    schema: schema,
    entry: { ... },
    columnMapping: columnMapping,  // Pass column mapping
  });
}
```

---

## Phase 3: Integration & Testing

### 1. Update AddEntryModal to Pass Mapping
**File**: `src/components/AddEntryModal.tsx`

**Change**:
```javascript
// Get user settings including column mapping
const settings = await getUserSettings(user.uid);

// Pass mapping to sync function
await syncEntryToNotion(
  entry,
  settings.notionApiKey,
  settings.notionDatabaseId,
  schema?.id,
  settings.notionColumnMapping  // NEW: Pass the mapping
);
```

### 2. Complete Onboarding Flow

**For "Create New Database"**:
```
1. User selects template (Macro Tracking)
2. System creates schema from template
3. System creates Notion database with schema columns
4. System saves: notionDatabaseId, activeSchemaId, templateId
5. No column mapping needed (we control column names)
```

**For "Use Existing Database"**:
```
1. User selects template (Macro Tracking)
2. System creates schema from template
3. System analyzes existing Notion database
4. System auto-matches columns (exact + contains)
5. User reviews/adjusts mapping in NotionColumnMapper
6. System saves: notionDatabaseId, activeSchemaId, templateId, notionColumnMapping
7. Future syncs use the mapping
```

---

## Phase 4: Testing Checklist

### Template Selection
- [ ] Three template cards display correctly
- [ ] Selected template is highlighted
- [ ] Template selection persists through onboarding
- [ ] Schema created in Firestore from template
- [ ] activeSchemaId saved to UserSettings

### New Database Creation
- [ ] Database created with correct columns for Macro Tracking
- [ ] Database created with correct columns for Simple Logging
- [ ] Database created with correct columns for Keto Tracking
- [ ] Column types match schema (title, number, date, rich_text, url)

### Existing Database Connection
- [ ] Exact column matches detected (e.g., "Protein" → "Protein")
- [ ] Partial matches detected (e.g., "Carbs" → "Carb")
- [ ] Case-insensitive matching works
- [ ] Contains matching works ("Protein (g)" contains "protein")
- [ ] User can adjust mappings in UI
- [ ] Column mapping saved to UserSettings

### Entry Syncing
- [ ] Entries sync with all macro fields (Protein, Carbs, Fat, Calories)
- [ ] Title syncs to correct column (e.g., "Meal Name" not "Name")
- [ ] Date syncs to correct column (e.g., "When" not "Date")
- [ ] Summary syncs to correct column (e.g., "Notes" not "Summary")
- [ ] Fields without matches are skipped (no errors)
- [ ] Photo URL syncs correctly

### End-to-End Flow
- [ ] User completes onboarding with template selection
- [ ] User creates entry with photo + description
- [ ] AI generates title, macros, summary
- [ ] User reviews in ReviewEntryModal
- [ ] Entry saves to Firestore with fieldValues
- [ ] Entry syncs to Notion with correct column names
- [ ] All macro values appear in correct Notion columns

---

## Files to Create

### New Files:
1. `src/components/NotionSchemaSelector.tsx` - Template selection UI
2. `src/components/NotionSchemaSelector.css` - Styling for template cards
3. `src/components/NotionColumnMapper.tsx` - Column mapping review UI
4. `src/components/NotionColumnMapper.css` - Styling for mapping UI
5. `src/services/notionColumnMatcher.ts` - Column matching algorithm

### Files to Update:
1. `src/components/NotionOnboarding.tsx` - Add template selection step
2. `src/services/firestore.ts` - Add `createSchemaFromTemplate()`
3. `src/services/notion.ts` - Update `syncEntryToNotion()` with columnMapping param
4. `src/components/AddEntryModal.tsx` - Pass column mapping to sync
5. `src/types/index.ts` - Add `notionColumnMapping` to UserSettings
6. `functions/index.js` - Update `notionSyncEntry` to use column mapping

---

## Estimated Development Order

1. **Step 1**: Create `NotionSchemaSelector` component (2-3 hours)
2. **Step 2**: Create `createSchemaFromTemplate()` function (30 min)
3. **Step 3**: Update `NotionOnboarding` with template selection (1 hour)
4. **Step 4**: Test new database creation with templates (30 min)
5. **Step 5**: Create column matching algorithm (1 hour)
6. **Step 6**: Create `NotionColumnMapper` component (2-3 hours)
7. **Step 7**: Update `notionSyncEntry` Cloud Function (1 hour)
8. **Step 8**: Update client-side sync to use mapping (30 min)
9. **Step 9**: Integration testing (1-2 hours)
10. **Step 10**: Deploy and end-to-end testing (1 hour)

**Total Estimated Time**: 10-13 hours

---

## Priority Order

### Must Have (MVP):
1. Template selection UI
2. Schema creation from template
3. New database creation with schema columns
4. Entry syncing with all macro fields

### Nice to Have:
1. Column matching for existing databases
2. Column mapping UI
3. Smart field skipping

### Future Enhancements:
1. Custom field creation (beyond presets)
2. Multiple schema support
3. Schema editing
4. Import existing entries to Notion
5. Bulk operations
