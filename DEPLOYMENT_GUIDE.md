# Deployment Guide - Database Configuration Feature

## 🚀 Steps to Deploy

This guide will help you deploy the new dynamic database configuration feature.

---

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged into Firebase (`firebase login`)
- [ ] Project selected (`firebase use your-project-id`)

---

## Step 1: Deploy Firestore Rules & Indexes

The new `schemas` collection needs security rules and indexes.

```bash
cd /Users/seanx/code/winy.ai/food\ app/food-winy-ai

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

**Expected output:**
```
✔ Deploy complete!
✔ firestore: rules deployed successfully
✔ firestore: indexes deployed successfully
```

**What this does:**
- Adds security rules for the `schemas` collection
- Creates composite index for efficient schema queries (userId + updatedAt)

---

## Step 2: Deploy Firebase Functions

The Cloud Functions have been updated to support dynamic schemas.

```bash
# Make sure you're in the root directory
cd /Users/seanx/code/winy.ai/food\ app/food-winy-ai

# Deploy functions
firebase deploy --only functions
```

**Functions being deployed:**
- `notionSearchDatabases` (unchanged)
- `notionCreateDatabase` (✨ UPDATED - now supports dynamic schemas)
- `notionSyncEntry` (✨ UPDATED - now supports dynamic field values)
- `notionVerifyConnection` (unchanged)

**Expected output:**
```
✔ functions[notionCreateDatabase]: Successful update operation
✔ functions[notionSyncEntry]: Successful update operation
```

⏱️ **Note:** This may take 2-3 minutes.

---

## Step 3: Build and Deploy Frontend

Build the React app with all the new components and deploy to Firebase Hosting.

```bash
# Build the app
npm run build

# Deploy to hosting
firebase deploy --only hosting
```

**Expected output:**
```
✔ hosting: build folder uploaded successfully
✔ Deploy complete!
```

**New files being deployed:**
- `SchemaSelector` component
- `DynamicEntryForm` component
- Updated `AddEntryModal`, `EntryCard`, `NotionOnboarding`, `Settings`
- Schema templates configuration
- Updated types and services

---

## Step 4: Verify Deployment

### 4.1 Check Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Verify `schemas` collection rules are visible under "Rules" tab
5. Check "Indexes" tab - should see new `schemas` composite index

### 4.2 Check Cloud Functions

1. In Firebase Console, go to **Functions**
2. Verify all 4 functions show status: ✅ Healthy
3. Check logs for any errors:
   ```bash
   firebase functions:log
   ```

### 4.3 Test the Live App

1. Go to your deployed app URL (e.g., `https://food-winy-ai.web.app` or `food.winy.ai`)
2. Log in or create a new account
3. Go to **Settings**
4. Click **"Set Up Notion Integration"**

**Expected Flow:**
- ✅ See intro screen
- ✅ Click "Get Started" → Schema selection screen appears
- ✅ See 4 template cards (Simple, Macro, Full Nutrition, Minimal)
- ✅ Select "Macro Tracking"
- ✅ See "Creating schema..." loading message
- ✅ Redirected to API key entry screen
- ✅ Continue with normal Notion setup

5. **Create a Test Entry:**
- Click "+" button
- Should see dynamic form with: Name, Photo, Meal Type, Protein, Carbs, Fat, Calories
- Fill in some values
- Submit
- Entry should sync to Notion with all fields visible

6. **Check Entry Display:**
- Entry card should show dynamic fields (e.g., "Protein: 35 g", "Carbs: 10 g")
- Schema badge should appear in footer
- Photo and AI summary should display

---

## Step 5: Monitor for Issues

### Check Firestore

```bash
# Open Firestore in browser
firebase open firestore
```

Look for:
- `schemas` collection should start appearing
- New entries should have `schemaId` and `fieldValues` fields
- `settings` docs should have `activeSchemaId` field

### Check Function Logs

```bash
# Stream live logs
firebase functions:log --only notionCreateDatabase,notionSyncEntry

# Look for:
# ✅ "Building database with schema: Macro Tracking"
# ✅ "Syncing entry with schema: Macro Tracking"
# ❌ Any errors or exceptions
```

### Check Browser Console

Open DevTools (F12) and look for:
- ✅ "Creating schema..." log
- ✅ "Schema created: [id]"
- ✅ "Syncing entry to Notion via Cloud Function..."
- ❌ Any red errors

---

## Rollback Plan (If Needed)

If something goes wrong:

### Rollback Functions Only
```bash
# List previous deployments
firebase functions:log

# Rollback to specific version (if needed, contact Firebase support)
# Or redeploy previous version from git
```

### Rollback Frontend Only
```bash
git checkout [previous-commit]
npm run build
firebase deploy --only hosting
```

### Rollback Everything
```bash
git checkout [previous-commit]
npm run build
firebase deploy
```

---

## Common Issues & Solutions

### Issue: "Schema not found" error in logs
**Solution:** 
- Check that `firestore:rules` deployed successfully
- Verify user is authenticated
- Check browser console for more details

### Issue: Notion database created but missing fields
**Solution:**
- Check `notionCreateDatabase` function logs
- Verify schema was created in Firestore first
- Test schema selector - make sure selection completes

### Issue: Entry form shows legacy form instead of dynamic form
**Solution:**
- User might not have a schema - they need to reconnect Notion with new flow
- Check `settings.activeSchemaId` in Firestore
- Check browser console for "No active schema" message

### Issue: Existing entries don't show in feed
**Solution:**
- Backward compatibility should handle this
- Check `EntryCard` component error handling
- Legacy entries should still display with their `text`, `photoUrl`, `aiSummary`

---

## Testing Checklist

After deployment, test these scenarios:

### New User Journey
- [ ] New user signs up
- [ ] Goes to Settings → Set Up Notion
- [ ] Sees schema selection
- [ ] Selects "Macro Tracking"
- [ ] Completes Notion setup
- [ ] Creates entry with macro fields
- [ ] Entry displays correctly
- [ ] Entry appears in Notion with all fields

### Existing User Journey (If you have test users)
- [ ] Existing user logs in
- [ ] Can still see old entries
- [ ] Old entries display correctly
- [ ] Can create new entries (uses legacy form if no schema)
- [ ] If they reconnect Notion, they get schema selection

### Edge Cases
- [ ] User cancels schema selection (can try again)
- [ ] User selects different templates (all work)
- [ ] No internet connection during schema creation (graceful error)
- [ ] Notion API key invalid (proper error message)
- [ ] Photo upload works in dynamic form
- [ ] Required fields enforced

---

## Performance Monitoring

After deployment, monitor:

1. **Firebase Firestore Metrics:**
   - Read/write operations should be normal
   - New `schemas` collection should have minimal reads
   - Each entry creation: +1 read (schema), +1 write (entry)

2. **Cloud Functions Performance:**
   - `notionCreateDatabase` should complete in < 3 seconds
   - `notionSyncEntry` should complete in < 2 seconds
   - Check for timeout errors (should be rare)

3. **User Experience:**
   - Schema selection loads instantly (static templates)
   - Entry form renders in < 500ms
   - Entry cards load normally

---

## Success Metrics

You'll know deployment is successful when:

✅ No errors in Firebase Console (Functions, Firestore, Hosting)  
✅ New users can select schema templates  
✅ Schemas are created in Firestore  
✅ Notion databases created with custom fields  
✅ Entries sync with all custom fields  
✅ Dynamic fields display in feed  
✅ Existing entries still work  

---

## Next Steps After Deployment

1. **Monitor for 24-48 hours:**
   - Check logs daily
   - Watch for user reports
   - Monitor Firestore usage

2. **Gather User Feedback:**
   - Do users understand template selection?
   - Are default templates useful?
   - Any confusion points?

3. **Optional Enhancements (Future):**
   - Phase 2: Custom schema editor
   - Phase 5: AI field extraction
   - Migration script for existing users

---

## Support

If you encounter issues during deployment:

1. Check Firebase Console logs
2. Check browser DevTools console
3. Review `IMPLEMENTATION_SUMMARY.md` for architecture details
4. Test in incognito mode to rule out caching issues

---

**Last Updated:** January 2025  
**Estimated Deployment Time:** 10-15 minutes  
**Difficulty:** Moderate (involves multiple services)  

Good luck with the deployment! 🚀


