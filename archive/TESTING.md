# Testing Guide - Current Implementation

This guide helps you test the food tracking app's current features before building additional functionality.

**Deployed App**: https://food-winy-ai.web.app

---

## Prerequisites

### Required:
- ✅ Firebase project configured
- ✅ Gemini API key in `.env`
- ✅ App deployed to Firebase Hosting
- ✅ Cloud Functions deployed (6 functions)

### Optional (for Notion tests):
- 🔧 Notion integration created at [notion.so/my-integrations](https://www.notion.so/my-integrations)
- 🔧 Notion database or page shared with integration

---

## Test 1: Review Entry Modal Flow ⭐ START HERE

**Goal**: Verify the AI-powered entry creation with review-before-save pattern works correctly.

### Test Steps:

1. **Open the app**: https://food-winy-ai.web.app

2. **Sign in** with Google or email/password

3. **Click the "New Entry" button** (usually a "+" or "Add" button in the feed)

4. **Enter a food description**:
   ```
   Grilled chicken breast with brown rice and steamed broccoli, about 6oz chicken
   ```

5. **(Optional) Add a photo**:
   - Click "Add Photo"
   - Select or take a food photo
   - Verify photo preview appears

6. **Click "Continue" button**

7. **Wait for AI processing**:
   - Button should show "Analyzing..."
   - Should take 2-5 seconds

### Expected Results:

#### ✅ ReviewEntryModal Should Appear With:

**Title Field** (editable text input):
- Should contain an AI-generated title like:
  - "Grilled Chicken Bowl"
  - "Chicken and Rice"
  - "Healthy Chicken Dinner"
- ✅ Should be editable

**Macro Fields** (in a grid layout):
- **Protein**: ~35-45g (editable number)
- **Carbs**: ~50-60g (editable number)
- **Fat**: ~10-15g (editable number)
- **Calories**: ~400-500 kcal (editable number)
- ✅ All should be editable
- ✅ Should have unit labels (g, kcal)

**Summary Field** (editable textarea):
- Should contain 1-2 sentences like:
  - "High-protein meal with lean grilled chicken, brown rice, and steamed broccoli - a balanced, nutritious dinner."
- ✅ Should be editable

**Photo Preview**:
- ✅ Should display the photo if you uploaded one

**Action Buttons**:
- ✅ "Cancel" button (closes modal)
- ✅ "Save Entry" button (saves to Firestore)

### Test Editing:

8. **Edit the title**: Change to "My Healthy Dinner"

9. **Edit a macro value**: Change Calories to 550

10. **Edit the summary**: Add "Perfect post-workout meal." to the end

11. **Click "Save Entry"**

### Expected Results After Saving:

✅ Modal closes automatically
✅ Entry appears in the feed
✅ Entry shows your edited title: "My Healthy Dinner"
✅ Entry shows edited calories: 550 kcal
✅ Other values remain as AI-generated

### Browser Console Check:

Open browser console (F12) and look for:
```
Creating entry with data: {...}
Entry created successfully: {...}
Created entry fieldValues: { name: "My Healthy Dinner", protein: 42, ... }
```

---

## Test 2: Entry Without Photo

**Goal**: Verify text-only entries work.

### Test Steps:

1. **Click "New Entry"**

2. **Enter description only** (no photo):
   ```
   Two scrambled eggs with whole wheat toast and avocado
   ```

3. **Click "Continue"**

4. **Review AI-generated data**:
   - Title: ~"Scrambled Eggs and Toast"
   - Protein: ~15-20g
   - Carbs: ~25-35g
   - Fat: ~15-25g
   - Calories: ~300-400

5. **Save without editing**

### Expected Results:

✅ Entry creates successfully without photo
✅ AI still generates accurate macro estimates
✅ Entry appears in feed without photo

---

## Test 3: Entry With Photo Only

**Goal**: Verify photo-only entries work.

### Test Steps:

1. **Click "New Entry"**

2. **Add a photo only** (leave description empty or add minimal text like "lunch")

3. **Click "Continue"**

4. **Review AI-generated data**

### Expected Results:

✅ AI analyzes the photo and generates:
- Title based on visual content
- Macro estimates from image recognition
- Summary describing what's visible in the photo

✅ Photo appears in ReviewEntryModal
✅ Entry saves successfully

---

## Test 4: Cancel During Review

**Goal**: Verify cancellation works without data loss.

### Test Steps:

1. **Create a new entry**

2. **Let AI analyze**

3. **Click "Cancel" in ReviewEntryModal**

### Expected Results:

✅ Modal closes
✅ Returns to AddEntryModal (should still have your description/photo)
✅ No entry created in Firestore
✅ Can try again or close completely

---

## Test 5: Basic Notion Sync (Legacy Mode)

**Goal**: Test Notion integration with default columns.

⚠️ **Note**: This tests basic sync only. Full schema-based sync with macros requires template selection UI (not built yet).

### Setup:

1. **Create Notion Integration**:
   - Go to https://www.notion.so/my-integrations
   - Click "+ New integration"
   - Name: "Winy AI Test"
   - Copy the "Internal Integration Token"

2. **Create a Simple Notion Database**:
   - Open Notion
   - Create a new database (table view)
   - Add these columns:
     - **Name** (Title) - should already exist
     - **Date** (Date)
     - **Summary** (Text)
     - **Photo** (URL)
   - Click "..." menu → "Add connections" → Select "Winy AI Test"
   - Copy database ID from URL: `https://notion.so/xxx?v=yyy` → copy `xxx`

### In the App:

3. **Go to Settings page**

4. **Notion Integration section**:
   - Paste your Notion API key (integration token)
   - Paste your database ID
   - Click "Verify Connection"

### Expected Results:

✅ "Connection verified" message appears
✅ Settings save successfully

### Create and Sync an Entry:

5. **Create a new entry** (follow Test 1 steps)

6. **Save the entry**

7. **Check browser console** for:
   ```
   Syncing entry to Notion via Cloud Function...
   Loaded schema for Notion sync: null (or undefined)
   Notion sync result: { pageId: "..." }
   ```

8. **Open your Notion database**

### Expected Results in Notion:

✅ **New row appears** with:
- **Name**: The entry title (e.g., "Grilled Chicken Bowl")
- **Date**: Today's date
- **Summary**: The AI-generated summary
- **Photo**: Link to the uploaded photo (if any)

⚠️ **Expected Limitation**:
- ❌ Protein, Carbs, Fat, Calories do NOT appear (columns don't exist)
- This is because:
  1. We're using legacy sync mode
  2. Template selection UI isn't built yet
  3. Schema isn't passed to Cloud Function

---

## Test 6: Verify Cloud Functions Are Deployed

**Goal**: Ensure all Cloud Functions are accessible.

### Check Firebase Console:

1. Go to https://console.firebase.google.com
2. Select your project (food-winy-ai)
3. Go to "Functions" in left sidebar
4. Verify these 6 functions exist:
   - ✅ notionSearchDatabases
   - ✅ notionCreatePage
   - ✅ notionCreateDatabase
   - ✅ notionVerifyConnection
   - ✅ notionAnalyzeDatabase (NEW)
   - ✅ notionSyncEntry (NEW)

### Alternative: Browser Console Test

Open browser console and run:

```javascript
// Test notionAnalyzeDatabase
const functions = firebase.functions();
const analyze = functions.httpsCallable('notionAnalyzeDatabase');

// Replace with your real API key and database ID
analyze({
  notionApiKey: 'your-api-key',
  databaseId: 'your-database-id'
}).then(result => console.log('Database analysis:', result.data));
```

### Expected Result:

```javascript
{
  databaseId: "xxx",
  title: "Your Database Name",
  columns: [
    { name: "Name", type: "title", id: "..." },
    { name: "Date", type: "date", id: "..." },
    { name: "Summary", type: "rich_text", id: "..." },
    // ... other columns
  ]
}
```

---

## Test 7: Entry Feed Display

**Goal**: Verify entries display correctly in the feed.

### Test Steps:

1. **Create 3-5 entries** with different foods

2. **View the feed page**

### Expected Results:

✅ Entries appear in reverse chronological order (newest first)
✅ Each entry card shows:
- Title
- Date/timestamp
- Summary
- Photo (if uploaded)
- Macro values (if displayed in EntryCard component)

✅ Smooth scrolling
✅ Apple-inspired minimalist design

---

## Test 8: Error Handling

**Goal**: Test error cases and validation.

### Test Case 1: Empty Entry

1. **Click "New Entry"**
2. **Click "Continue" without entering anything**

**Expected**: ❌ Error message: "Please add some text or a photo"

### Test Case 2: Invalid Notion Credentials

1. **Go to Settings**
2. **Enter fake Notion API key**: "secret_fake123"
3. **Enter fake database ID**: "123abc"
4. **Click "Verify Connection"**

**Expected**: ❌ Error message about invalid credentials

### Test Case 3: Network Error

1. **Disconnect from internet**
2. **Try to create an entry**

**Expected**: ❌ Error about network failure or AI analysis timeout

---

## Test 9: Photo Upload

**Goal**: Test photo handling edge cases.

### Test Case 1: Large Photo

- Upload a high-resolution photo (5MB+)
- **Expected**: ✅ Upload works, may take longer

### Test Case 2: Remove Photo

1. Add a photo
2. Click "×" to remove it
3. **Expected**: ✅ Photo preview disappears, can add new photo

### Test Case 3: Replace Photo

1. Add a photo
2. Remove it
3. Add a different photo
4. **Expected**: ✅ New photo appears

---

## Test 10: Settings Page

**Goal**: Verify settings functionality.

### Test Steps:

1. **Navigate to Settings page**

2. **Check sections**:
   - ✅ User info displayed (email)
   - ✅ Notion Integration section visible
   - ✅ Input fields for API key and database ID
   - ✅ "Verify Connection" button
   - ✅ "Create New Database" option (if implemented)

3. **Update Notion credentials**

4. **Verify they persist** (refresh page)

**Expected**: ✅ Settings save and persist across page reloads

---

## Known Limitations (To Be Built)

### ❌ Missing Features:

1. **Template Selection UI**
   - Can't choose Macro Tracking, Simple Logging, or Keto Tracking
   - System doesn't know which fields to track
   - Creates default columns only

2. **Schema-Based Sync**
   - Entries don't sync with Protein, Carbs, Fat, Calories to Notion
   - Only syncs Name, Date, Summary, Photo (legacy mode)
   - Need template selection to work

3. **Column Matching**
   - Can't detect existing database columns
   - Can't map "When" → "Date" or "Meal Name" → "Name"
   - Sync fails if column names don't match exactly

4. **Column Mapping Storage**
   - No way to save custom column mappings
   - No UI to review/adjust auto-matched columns

---

## Success Criteria

### ✅ Minimum Viable Testing:

- [ ] Test 1 passes (Review Entry Modal works)
- [ ] Test 2 passes (Text-only entries work)
- [ ] Test 3 passes (Photo-only entries work)
- [ ] Test 5 passes (Basic Notion sync works)

### ⭐ Ideal Testing:

- [ ] All tests 1-10 pass
- [ ] No console errors
- [ ] Smooth user experience
- [ ] Data persists correctly
- [ ] Notion sync works reliably

---

## Troubleshooting

### Issue: ReviewEntryModal doesn't appear

**Possible causes**:
- AI analysis failed
- Gemini API key invalid
- Network error

**Debug**:
- Check browser console for errors
- Verify Gemini API key in `.env`
- Check if "Analyzing..." appears before error

### Issue: Entry doesn't save

**Possible causes**:
- Firestore rules not deployed
- User not authenticated
- Network error

**Debug**:
- Check browser console
- Verify authentication status
- Deploy Firestore rules: `firebase deploy --only firestore:rules`

### Issue: Notion sync fails

**Possible causes**:
- Invalid API key
- Database not shared with integration
- Column names don't match
- Cloud Function error

**Debug**:
- Verify connection in Settings
- Check database sharing in Notion
- Check browser console for Cloud Function errors
- Check Firebase Functions logs in console

### Issue: Photos don't upload

**Possible causes**:
- Storage rules not deployed
- Photo too large
- Network error

**Debug**:
- Deploy storage rules: `firebase deploy --only storage:rules`
- Try smaller photo
- Check browser console

---

## Reporting Issues

When you find a bug, please note:

1. **Test number** that failed
2. **Browser** (Chrome, Safari, Firefox)
3. **Error message** (from browser console)
4. **Steps to reproduce**
5. **Expected vs actual behavior**

Example:
```
Test 5 failed
Browser: Chrome 120
Error: "Failed to sync entry to Notion"
Steps: Created entry with photo, clicked save
Expected: Entry syncs to Notion
Actual: Console shows error about missing properties
```

---

## Next Steps After Testing

Once you've completed testing:

1. ✅ **Report results** - Which tests passed/failed
2. 📋 **Review NEXTSTEPS.md** - See what features to build next
3. 🔨 **Start development** - Begin with template selection UI
4. 🧪 **Test again** - Verify new features work

Good luck testing! 🚀
