# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

food.winy.ai is a Notion-style food logging web app that combines photo capture, AI-powered nutritional analysis (via Google Gemini), and automatic Notion database syncing. Users can create custom tracking schemas (simple food logs, macro tracking, full nutrition) and all entries automatically sync to their personal Notion databases.

**Tech Stack**: React + TypeScript + Vite, Firebase (Auth/Firestore/Storage/Hosting/Functions), Google Gemini AI, Notion API

## Development Commands

### Development
```bash
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Build for production (TypeScript + Vite)
npm run preview          # Preview production build locally
npm run lint             # Run ESLint
```

### Firebase Deployment
```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting          # Deploy web app
firebase deploy --only functions        # Deploy Cloud Functions
firebase deploy --only firestore:rules  # Deploy Firestore security rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules

# Set Firebase project
firebase use food-winy-ai
```

### Environment Setup
```bash
cp .env.example .env     # Create environment file
# Then fill in Firebase and Gemini API credentials
```

## Architecture

### Core Data Flow

1. **User creates entry** → Photo uploaded to Firebase Storage → Photo URL saved
2. **AI extraction** → Gemini analyzes photo + text → Extracts field values based on active schema
3. **Save to Firestore** → Entry saved to `entries` collection with `fieldValues` object
4. **Notion sync** → Cloud Function calls Notion API → Creates page in user's database

### Schema System (Dynamic Tracking)

The app uses a **flexible schema system** where users choose what to track:

- **Templates**: Predefined schemas in [src/config/schemaTemplates.ts](food-winy-ai/src/config/schemaTemplates.ts)
  - `simple`: Name, date, photo, summary
  - `macro`: Above + protein/carbs/fat/calories + meal type
  - `full-nutrition`: Above + fiber/sugar/sodium
  - `minimal`: Name, date, photo only

- **Schema storage**: User schemas stored in Firestore `schemas` collection
- **Active schema**: Tracked in user settings (`activeSchemaId`)
- **Field extraction**: Gemini extracts values for fields with `extractFromAI: true`

**Key files:**
- [src/types/index.ts](food-winy-ai/src/types/index.ts) - `DatabaseSchema` and `FieldConfig` types
- [src/config/schemaTemplates.ts](food-winy-ai/src/config/schemaTemplates.ts) - Template definitions
- [src/services/firestore.ts](food-winy-ai/src/services/firestore.ts) - Schema CRUD operations (lines 110-217)

### Firebase Collections Structure

```
firestore/
├── entries/          # Food log entries
│   ├── userId        # Owner ID
│   ├── schemaId      # Which schema was used
│   ├── timestamp     # When created
│   ├── fieldValues   # Dynamic data: { protein: 25, meal_type: "Lunch", ... }
│   ├── photoUrl      # Firebase Storage URL
│   └── notionPageId  # Synced Notion page ID
│
├── settings/         # User settings (doc ID = userId)
│   ├── notionApiKey
│   ├── notionDatabaseId
│   ├── activeSchemaId
│   └── geminiApiKey
│
└── schemas/          # User-defined tracking schemas
    ├── userId
    ├── name
    ├── templateId
    ├── fields[]      # Array of FieldConfig objects
    └── createdAt/updatedAt
```

### Notion Integration Architecture

**Challenge**: Notion API has CORS restrictions, cannot call directly from browser.

**Solution**: Firebase Cloud Functions proxy in [functions/index.js](food-winy-ai/functions/index.js)

```
Frontend → Firebase Function → Notion API
         (bypasses CORS)
```

**Available Functions:**
- `notionSearchDatabases` - List user's accessible databases
- `notionCreateDatabase` - Create new database from schema
- `notionSyncEntry` - Create entry page with dynamic properties
- `notionVerifyConnection` - Test API key validity

**Schema-to-Notion mapping**: Function reads `schemaId` from Firestore, retrieves schema, creates Notion properties matching field configs, then populates with `fieldValues` from entry.

### Component Architecture

**Pages** ([src/pages/](food-winy-ai/src/pages/)):
- `Login.tsx` - Email/password + Google OAuth
- `Feed.tsx` - Entry list + add modal + schema selection
- `Settings.tsx` - Notion/Gemini config + schema management

**Key Components** ([src/components/](food-winy-ai/src/components/)):
- `AddEntryModal.tsx` - Photo capture/upload → AI extraction → save
- `DynamicEntryForm.tsx` - Renders form fields based on active schema
- `NotionOnboarding.tsx` - Database selection/creation wizard
- `EntryCard.tsx` - Display entry with fieldValues

**Services** ([src/services/](food-winy-ai/src/services/)):
- `firestore.ts` - All Firestore operations (entries, settings, schemas)
- `gemini.ts` - AI field extraction via Google Generative AI
- `notion.ts` - Cloud Function wrappers for Notion API

## Important Implementation Details

### AI Field Extraction

When creating an entry, Gemini is prompted to extract values for all fields where `extractFromAI: true`:

```typescript
// Example prompt for macro schema:
"Extract: name (food name), meal_type (Breakfast/Lunch/Dinner/Snack),
protein (grams), carbs (grams), fat (grams), calories (kcal)"
```

Returns JSON: `{ name: "Grilled Chicken Salad", meal_type: "Lunch", protein: 35, ... }`

### Dynamic Form Rendering

`DynamicEntryForm` renders input fields based on schema's `fields` array. Only fields with `showInForm: true` are displayed. Field type determines UI component (text input, select dropdown, number input, etc.).

### Security Rules

**Firestore** ([firestore.rules](food-winy-ai/firestore.rules)): Users can only read/write their own `entries`, `settings`, and `schemas` (enforced via `userId` field).

**Storage** ([storage.rules](food-winy-ai/storage.rules)): Users can only upload to their own folder (`{userId}/`).

### Authentication Flow

`useAuth` hook ([src/hooks/useAuth.ts](food-winy-ai/src/hooks/useAuth.ts)) wraps Firebase Auth. Protected routes in [App.tsx](food-winy-ai/src/App.tsx) redirect unauthenticated users to login.

## Common Development Scenarios

### Adding a new schema template
1. Add template to [src/config/schemaTemplates.ts](food-winy-ai/src/config/schemaTemplates.ts)
2. Define `fields` array with `FieldConfig` objects
3. Set `extractFromAI: true` for AI-extracted fields
4. Add to `SCHEMA_TEMPLATES` export

### Adding a new field type
1. Add type to `FieldConfig['type']` in [src/types/index.ts](food-winy-ai/src/types/index.ts)
2. Update `DynamicEntryForm.tsx` to render new input type
3. Update Gemini prompt generation in AI service
4. Update Notion property mapping in [functions/index.js](food-winy-ai/functions/index.js)

### Testing Notion integration locally
Cloud Functions require deployment to test. Use Firebase emulator suite OR deploy functions and test via production.

## Code Style

- TypeScript strict mode enabled
- Comprehensive JSDoc comments on all exported functions
- Minimal black/white UI design (Inter font)
- All Firebase operations in service files, not components
- Use `fieldValues` object for dynamic schema data, not hardcoded properties

## Changelog

**IMPORTANT**: When making changes to this codebase, maintain this changelog to track architectural decisions, new features, bug fixes, and breaking changes. This helps future Claude instances understand the evolution of the project.

### Format
```
### [Date] - [Brief Title]
**Changed by**: [Your identifier or "Claude Code"]
**Type**: [Feature|Bugfix|Refactor|Breaking Change|Documentation]

[Description of changes and reasoning]

**Files modified**:
- path/to/file1.ts
- path/to/file2.tsx

**Migration notes** (if breaking change):
[Instructions for updating existing code/data]
```

### Example Entry
```
### 2025-10-25 - Initial CLAUDE.md Creation
**Changed by**: Claude Code
**Type**: Documentation

Created comprehensive CLAUDE.md file documenting:
- Dynamic schema system architecture
- Notion CORS workaround via Cloud Functions
- Firebase collections structure
- AI field extraction flow

**Files modified**:
- CLAUDE.md (new)
```

---

### Changelog Entries

### 2025-10-25 - Initial CLAUDE.md Creation
**Changed by**: Claude Code
**Type**: Documentation

Created comprehensive CLAUDE.md file documenting the food.winy.ai codebase architecture, with focus on the dynamic schema system, Notion integration via Cloud Functions, and AI-powered field extraction flow.

**Files modified**:
- CLAUDE.md (new)
