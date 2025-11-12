# Notion Integration Guide - Database Connection & Sync

This guide explains how the Notion database integration works in the food.winy.ai app, including the page selector interface, database creation, and entry syncing.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Onboarding Flow](#onboarding-flow)
3. [Page Selector Implementation](#page-selector-implementation)
4. [Database Connection](#database-connection)
5. [Entry Sync Process](#entry-sync-process)
6. [Firebase Cloud Functions](#firebase-cloud-functions)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## Architecture Overview

The Notion integration uses a **Firebase Cloud Functions proxy pattern** to bypass CORS restrictions. The flow is:

```
Frontend (React) → Firebase Cloud Function → Notion API
```

**Key Components:**
- `src/services/notion.ts` - Frontend service layer
- `functions/index.js` - Firebase Cloud Functions (proxy)
- `src/components/NotionOnboarding.tsx` - Setup wizard
- `src/components/HierarchicalPageSelector.tsx` - Page picker UI
- `src/utils/pageHierarchy.ts` - Tree structure builder

**Why Cloud Functions?**
- Bypasses browser CORS restrictions
- Secures API keys (never exposed to client)
- Handles authentication centrally

---

## Onboarding Flow

### Step-by-Step User Journey

1. **Intro Screen** - User clicks "Set Up Notion Integration"
2. **Schema Selection** - User picks tracking template (Macro Tracking, Simple Logging, Keto Tracking)
3. **API Key Entry** - User pastes Notion Integration Token
4. **Database Selection** - User chooses/create database
5. **Success** - Configuration saved

### Code Flow

**File:** `src/components/NotionOnboarding.tsx`

```typescript
// Schema selection
const handleSchemaSelect = async (templateId: string) => {
  setSchemaId(templateId); // Store for later
  setStep('api-key');
};

// API key verification
const handleApiKeySubmit = async () => {
  const userDatabases = await listUserDatabases(apiKey);
  setDatabases(userDatabases);
  setStep('choose-database');
};

// Database creation
const handleCreateNewDatabase = async () => {
  const schema = createSchemaFromTemplate(schemaId, userId);
  const databaseId = await createFoodLogDatabase(
    apiKey, 
    selectedParentPageId, 
    schema
  );
  setDatabaseId(databaseId);
  setStep('success');
};
```

### Key Points

- **Schema Templates**: Pre-defined field configurations (see `src/constants/schemaTemplates.ts`)
- **Parent Page Required**: Notion requires databases to be created inside a page (not workspace root)
- **Integration Sharing**: User must share at least one page with the integration before onboarding

---

## Page Selector Implementation

### Hierarchical Structure

The page selector displays a **tree structure** mimicking Notion's interface, showing:
- Root pages (workspace-level)
- Nested child pages
- Page icons (emoji, image, or default SVG)
- Expand/collapse functionality

### Building the Tree

**File:** `src/utils/pageHierarchy.ts`

```typescript
export function buildPageHierarchy(pages: NotionDatabase[]): PageNode[] {
  // 1. Filter to only pages (exclude databases from tree)
  const pagesOnly = pages.filter(p => p.type === 'page');
  
  // 2. Find root pages (parent.type === 'workspace')
  const rootPages = pagesOnly.filter(page => 
    page.parent?.type === 'workspace'
  );
  
  // 3. Recursively build tree
  function buildNode(page: NotionDatabase, level: number = 0): PageNode {
    const children = findChildren(page.id, pagesOnly);
    return {
      ...page,
      children: children.map(child => buildNode(child, level + 1)),
      level,
    };
  }
  
  return rootPages.map(page => buildNode(page, 0));
}
```

### Page Icons (4-Tier Fallback System)

**File:** `src/components/HierarchicalPageSelector.tsx`

The component uses a priority system for icons:

1. **Emoji** (`icon.type === 'emoji'`) - Notion emoji icons
2. **External Image** (`icon.type === 'external'`) - Custom uploaded URLs
3. **Default SVG** (`NotionPageIcon` component) - Document icon
4. **Text Fallback** - First letter of page title

```typescript
const renderIcon = (node: PageNode) => {
  // Tier 1: Emoji
  if (node.icon?.type === 'emoji') {
    return <span>{node.icon.emoji}</span>;
  }
  
  // Tier 2: External/File images
  if (node.icon?.type === 'external') {
    return <img src={node.icon.external.url} />;
  }
  
  // Tier 3: Default SVG
  return <NotionPageIcon size={18} />;
  
  // Tier 4: Text (fallback in catch)
};
```

### Implementation Details

- **Indentation**: 20px per hierarchy level
- **Expand State**: Managed with `Set<string>` for performance
- **Selection**: Single-select with visual checkmark
- **Empty State**: Shows helpful message if no pages found

---

## Database Connection

### Listing Available Databases & Pages

**Frontend:** `src/services/notion.ts`

```typescript
export async function listUserDatabases(
  notionApiKey: string
): Promise<NotionDatabase[]> {
  const functions = getFunctions(app, 'us-central1');
  const searchDatabases = httpsCallable(functions, 'notionSearchDatabases');
  const result = await searchDatabases({ notionApiKey });
  return result.data.databases;
}
```

**Cloud Function:** `functions/index.js`

```javascript
exports.notionSearchDatabases = onCall(async (request) => {
  // 1. Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // 2. Call Notion Search API
  const response = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionApiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
    }),
  });
  
  // 3. Map results to app format
  return {
    databases: responseData.results.map((item) => ({
      id: item.id,
      title: item.object === 'database' 
        ? item.title?.[0]?.plain_text 
        : item.properties?.title?.title?.[0]?.plain_text,
      type: item.object, // 'page' or 'database'
      parent: item.parent, // For hierarchy
      icon: item.icon, // For display
    })),
  };
});
```

### Key Points

- **Search Endpoint**: `/v1/search` returns both pages and databases
- **Type Filtering**: Frontend filters `type === 'page'` for selector
- **Parent Info**: Included for building hierarchy
- **Icon Support**: Full icon data passed through

---

## Entry Sync Process

### How Entries Sync to Notion

**File:** `src/components/AddEntryModal.tsx`

```typescript
// After creating entry in Firestore
const entry = await createEntry(entryData);

// Sync to Notion
const settings = await getUserSettings(user.uid);
if (settings?.notionApiKey && settings?.notionDatabaseId) {
  const notionPageId = await syncEntryToNotion(
    entry,
    settings.notionApiKey,
    settings.notionDatabaseId,
    schema // Pass schema for dynamic property mapping
  );
}
```

### Dynamic Property Mapping

**Cloud Function:** `functions/index.js` → `notionSyncEntry`

The sync process uses the **schema** to dynamically map fields:

```javascript
if (schema && schema.fields && entry.fieldValues) {
  schema.fields.forEach((field) => {
    const value = entry.fieldValues[field.id];
    
    switch (field.notionPropertyType) {
      case 'title':
        properties[field.name] = {
          title: [{ text: { content: String(value) } }],
        };
        break;
        
      case 'number':
        properties[field.name] = {
          number: Number(value) || 0,
        };
        break;
        
      case 'date':
        properties[field.name] = {
          date: { start: new Date(value).toISOString() },
        };
        break;
        
      // ... etc
    }
  });
}
```

### Property Type Mapping

| Schema Type | Notion Property Type | Example |
|------------|---------------------|---------|
| `title` | `title` | Meal name |
| `text` | `rich_text` | AI summary |
| `number` | `number` | Calories, protein |
| `date` | `date` | Entry timestamp |
| `url` | `url` | Photo URL |
| `select` | `select` | Meal type |
| `checkbox` | `checkbox` | Boolean flags |

---

## Firebase Cloud Functions

### Function Setup

All Notion API calls go through Firebase Cloud Functions:

**File:** `functions/index.js`

### Available Functions

1. **`notionSearchDatabases`**
   - Lists all pages and databases accessible by integration
   - Input: `{ notionApiKey }`
   - Output: `{ databases: NotionDatabase[] }`

2. **`notionCreateDatabase`**
   - Creates new database with dynamic schema
   - Input: `{ notionApiKey, parentPageId, schema }`
   - Output: `{ databaseId }`

3. **`notionVerifyConnection`**
   - Tests API key and database access
   - Input: `{ notionApiKey, databaseId }`
   - Output: `{ isValid: boolean }`

4. **`notionSyncEntry`**
   - Creates Notion page from food entry
   - Input: `{ notionApiKey, databaseId, entry, schema }`
   - Output: `{ pageId, url }`

5. **`notionAnalyzeDatabase`**
   - Returns database schema info (columns/types)
   - Input: `{ notionApiKey, databaseId }`
   - Output: `{ databaseId, title, columns[] }`

### Authentication

All functions verify Firebase auth:

```javascript
exports.notionSearchDatabases = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  // ... function logic
});
```

### Error Handling

Functions catch and re-throw with helpful messages:

```javascript
catch (error) {
  console.error('Error:', error);
  throw new HttpsError('internal', error.message || 'Failed to...');
}
```

---

## Common Issues & Solutions

### Issue 1: "No workspace pages found"

**Cause:** Integration hasn't been shared with any pages.

**Solution:**
1. User must create a page in Notion
2. Click `•••` menu → "Add connections"
3. Select the integration
4. Refresh onboarding

**Code Location:** `NotionOnboarding.tsx` line 334-355

### Issue 2: "Authentication failed" error

**Cause:** Firebase auth token expired or invalid.

**Solution:**
```typescript
// Always refresh token before API calls
await currentUser.getIdToken(true); // Force refresh
```

**Code Location:** `notion.ts` line 142

### Issue 3: Database creation fails

**Cause:** Parent page not shared with integration OR invalid parent page ID.

**Solution:**
- Verify parent page is shared (use `listUserDatabases` to confirm)
- Check parent page ID format (no hyphens)

**Code Location:** `functions/index.js` line 134-236

### Issue 4: Entry sync fails - "property not found"

**Cause:** Database schema doesn't match entry's field values.

**Solution:**
- Use schema-based mapping (pass schema to `syncEntryToNotion`)
- Fall back to legacy properties if schema missing
- Verify database properties match schema template

**Code Location:** `functions/index.js` line 330-456

### Issue 5: Icons not displaying

**Cause:** Image URLs require authentication or expired.

**Solution:**
- Implement 3-tier fallback (emoji → image → default SVG → text)
- Handle `onError` for images gracefully
- Cache icon URLs if possible

**Code Location:** `HierarchicalPageSelector.tsx` line 50-97

### Issue 6: CORS errors

**Cause:** Trying to call Notion API directly from browser.

**Solution:**
- **ALWAYS** use Cloud Functions, never call Notion API from frontend
- Functions run server-side, no CORS restrictions

**Example (WRONG):**
```typescript
// ❌ DON'T DO THIS - CORS will fail
const response = await fetch('https://api.notion.com/v1/...');
```

**Example (CORRECT):**
```typescript
// ✅ Use Cloud Function
const functions = getFunctions(app);
const syncEntry = httpsCallable(functions, 'notionSyncEntry');
const result = await syncEntry({ ... });
```

---

## Testing the Integration

### 1. Test API Key Validation

```typescript
const databases = await listUserDatabases(apiKey);
console.log('Found databases:', databases.length);
```

### 2. Test Database Creation

```typescript
const databaseId = await createFoodLogDatabase(
  apiKey,
  parentPageId,
  schema
);
console.log('Created database:', databaseId);
```

### 3. Test Entry Sync

```typescript
const pageId = await syncEntryToNotion(
  entry,
  apiKey,
  databaseId,
  schema
);
console.log('Created Notion page:', pageId);
```

### 4. Test Page Selector

```typescript
const tree = buildPageHierarchy(databases);
console.log('Page tree:', tree);
```

---

## Key Learnings & Best Practices

### 1. **Always Use Cloud Functions**

Never call Notion API from browser. Always proxy through Firebase Functions.

### 2. **Schema-Based Mapping**

Pass full schema objects to enable dynamic property mapping. This allows:
- Different templates = different database structures
- Easy schema migrations
- Flexible field mapping

### 3. **Hierarchy Building**

Build tree structure on frontend for better UX. Notion API returns flat list, transform to tree for navigation.

### 4. **Icon Fallback Strategy**

Always implement fallback for icons:
- Try emoji
- Try image URL
- Fall back to default SVG
- Final fallback: text

### 5. **Error Messages**

Provide specific error messages:
- "Please share a page with your integration"
- "Database not found - check sharing permissions"
- "Authentication failed - try signing out and back in"

### 6. **Parent Page Requirement**

Notion requires databases to be created inside pages (not workspace root). Always require parent page selection.

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/services/notion.ts` | Frontend API service layer |
| `src/components/NotionOnboarding.tsx` | Setup wizard component |
| `src/components/HierarchicalPageSelector.tsx` | Page picker UI |
| `src/utils/pageHierarchy.ts` | Tree structure utilities |
| `src/components/NotionPageIcon.tsx` | Default icon SVG |
| `functions/index.js` | Cloud Functions proxy |
| `src/constants/schemaTemplates.ts` | Field templates |

---

## Next Steps for Other Agents

If you're struggling with database connection:

1. **Check Authentication**: Verify `request.auth` exists in Cloud Function
2. **Verify API Key Format**: Should start with `secret_` or `ntn_`
3. **Check Sharing**: User must share at least one page with integration
4. **Test Search Endpoint**: Use `/v1/search` to list accessible resources
5. **Verify Parent Page**: Database creation requires valid parent page ID
6. **Check Schema Mapping**: Ensure property names/types match

For specific errors, check:
- Browser console for frontend errors
- Firebase Functions logs for server errors
- Notion API response bodies for API errors

---

## Quick Debug Checklist

- [ ] User is authenticated (Firebase auth)
- [ ] API key is valid format (`secret_...` or `ntn_...`)
- [ ] At least one page is shared with integration
- [ ] Cloud Functions are deployed
- [ ] Notion API version header is correct (`2022-06-28`)
- [ ] Database properties match schema template
- [ ] Parent page ID is valid (no hyphens when passed to Notion)
- [ ] Entry has `fieldValues` populated
- [ ] Schema object is passed to sync function

---

*Last Updated: 2024-12-19*

