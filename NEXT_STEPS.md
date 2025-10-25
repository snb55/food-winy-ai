# Next Steps for food.winy.ai

Your app is ready! Follow these steps to get it running.

---

## 🚀 Phase 1: Local Setup (15-20 minutes)

### Step 1: Set Up Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Click "Add project" or use existing project
   - Name it: `food-winy-ai` (or your preferred name)
   

2. **Enable Authentication**
   - Go to Authentication → Get Started
   - Click "Sign-in method" tab
   - Enable **Email/Password**
   - Enable **Google** provider
   - Add your email as authorized domain if needed

3. **Create Firestore Database**
   - Go to Firestore Database → Create Database
   - Start in **production mode**
   - Choose a location close to your users
   - Click "Enable"

4. **Enable Storage**
   - Go to Storage → Get Started
   - Start in **production mode**
   - Use same location as Firestore
   - Click "Done"

5. **Get Firebase Configuration**
   - Go to Project Settings (⚙️ icon)
   - Scroll to "Your apps"
   - Click the web icon `</>`
   - Register app with nickname: `food-winy-ai`
   - Copy the `firebaseConfig` object
   - **Keep this tab open** - you'll need these values

### Step 2: Get Gemini API Key

1. **Visit Google AI Studio**
   - Go to: https://makersuite.google.com/app/apikey
   - Sign in with Google account
   - Click "Create API Key"
   - Copy the key (starts with `AI...`)

### Step 3: Configure Environment Variables

1. **Create `.env` file**
   ```bash
   cd food-winy-ai
   cp .env.example .env
   ```

2. **Edit `.env` file**

   Open `.env` in your text editor and fill in the values from Firebase and Gemini:

   ```env
   # From Firebase Config
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=food-winy-ai.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=food-winy-ai
   VITE_FIREBASE_STORAGE_BUCKET=food-winy-ai.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123

   # From Google AI Studio
   VITE_GEMINI_API_KEY=AIza...
   ```

   **Save the file**

### Step 4: Install Firebase CLI & Deploy Security Rules

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

   This will open a browser window. Log in with the same Google account you used for Firebase Console.

3. **Link Your Project**
   ```bash
   firebase use --add
   ```

   - Select your Firebase project from the list
   - Give it an alias: `default`

4. **Deploy Security Rules** (IMPORTANT!)
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   firebase deploy --only storage:rules
   ```

   You should see:
   ```
   ✔  Deploy complete!
   ```

### Step 5: Run the App Locally

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   - Visit: http://localhost:5173
   - You should see the login page!

3. **Test the app**
   - Click "Sign Up"
   - Create an account with email/password
   - OR click "Continue with Google"
   - Add your first food entry!

---

## 🎯 Phase 2: Deploy to Production (10-15 minutes)

### Step 1: Build the App

```bash
npm run build
```

You should see:
```
✓ built in XXXms
```

### Step 2: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Firebase will provide a URL like:
```
Hosting URL: https://food-winy-ai.web.app
```

**Visit this URL to see your live app!** 🎉

### Step 3: Set Up Custom Domain (food.winy.ai)

1. **Add Custom Domain in Firebase**
   - Go to Firebase Console → Hosting
   - Click "Add custom domain"
   - Enter: `food.winy.ai`
   - Click "Continue"

2. **Configure DNS Records**

   Firebase will show you DNS records to add. Go to your domain registrar (where you bought winy.ai):

   **For A Records:**
   ```
   Type: A
   Name: food
   Value: [IP from Firebase]
   TTL: 3600
   ```

   **For www (optional):**
   ```
   Type: CNAME
   Name: www.food
   Value: food.winy.ai
   TTL: 3600
   ```

3. **Wait for SSL Certificate**
   - Firebase automatically provisions SSL
   - Can take 24-48 hours
   - You'll get an email when ready
   - Once ready, https://food.winy.ai will work!

---

## 📔 Phase 3: Set Up Notion Integration (Optional, 10 minutes)

### Step 1: Create Notion Integration

1. **Go to Notion Integrations**
   - Visit: https://www.notion.so/my-integrations
   - Click "New integration"
   - Name: `food.winy.ai`
   - Select your workspace
   - Click "Submit"
   - **Copy the "Internal Integration Token"** (starts with `secret_`)

### Step 2: Create Notion Database

1. **Create a new page in Notion**
   - Name it: "Food Log" or similar

2. **Add a database**
   - Type `/table` and select "Table - Inline"
   - OR create a full page database

3. **Set up properties** (rename the default columns):
   - `Name` (Title) - already exists
   - `Date` (Date) - add this
   - `Summary` (Text) - add this
   - `Photo` (URL) - optional, add if you want

4. **Share with your integration**
   - Click ••• (three dots) in top right
   - Click "Add connections"
   - Search for "food.winy.ai"
   - Click to connect

5. **Get Database ID**
   - Copy the URL of your database
   - Format: `https://notion.so/workspace/DATABASE_ID?v=...`
   - The DATABASE_ID is the long string of letters/numbers
   - Example: `a1b2c3d4e5f6` (from URL)

### Step 3: Configure in App

1. **Open your deployed app**
   - Go to https://food.winy.ai (or your Firebase URL)
   - Log in
   - Click the ⚙️ Settings icon

2. **Add Notion credentials**
   - Paste your Integration Token
   - Paste your Database ID
   - Click "Save Settings"

3. **Test it!**
   - Go back to Feed
   - Create a new entry
   - Check your Notion database - it should appear there automatically!

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] App loads at http://localhost:5173
- [ ] Can create account with email/password
- [ ] Can login with Google
- [ ] Can upload a photo
- [ ] Can take a photo (on mobile)
- [ ] Can add text description
- [ ] AI summary generates correctly
- [ ] Entry appears in feed
- [ ] Can delete entry
- [ ] Settings page loads
- [ ] (If Notion configured) Entry syncs to Notion
- [ ] Production build works: `npm run build`
- [ ] Deployed app works at Firebase URL
- [ ] Custom domain works (after DNS propagation)

---

## 🐛 Troubleshooting

### "Firebase API key not configured"
- Check that `.env` file exists in project root
- Verify all variables are filled in `.env`
- Restart dev server: `Ctrl+C` then `npm run dev`

### "Permission denied" errors in console
- Run: `firebase deploy --only firestore:rules,storage:rules`
- Refresh the app and try again

### Google Sign-In doesn't work
- In Firebase Console → Authentication → Sign-in method
- Click Google provider
- Add your domain to "Authorized domains"
- For local: `localhost` should already be there

### Photos won't upload
- Check Firebase Console → Storage
- Verify Storage is enabled
- Check that storage rules are deployed

### AI summary says "Unable to generate summary"
- Verify Gemini API key in `.env` is correct
- Check API key is active in Google AI Studio
- Try creating a new API key if needed

### Notion sync fails
- Verify integration token is correct
- Check database is shared with integration
- Ensure database has Name, Date, and Summary properties

### Build fails
- Run: `npm install` to ensure all dependencies installed
- Check for TypeScript errors: `npm run build`
- Check Node.js version: `node -v` (should be 18+)

---

## 📊 Monitoring Your App

### Firebase Console

**Check these regularly:**

1. **Authentication**
   - Users → See signup/login activity
   - Sign-in methods → Manage providers

2. **Firestore Database**
   - Data → View all entries
   - Usage → Monitor reads/writes

3. **Storage**
   - Files → See uploaded photos
   - Usage → Monitor storage space

4. **Hosting**
   - Dashboard → See traffic stats
   - Release history → Rollback if needed

### Usage Limits (Free Tier)

Keep an eye on:
- Firestore: 50,000 reads/day, 20,000 writes/day
- Storage: 1GB total
- Hosting: 10GB bandwidth/month

For typical personal use (3-5 entries/day), you'll stay well within limits.

---

## 🎨 Customization Ideas

Once everything works, you might want to:

1. **Customize branding**
   - Edit `index.html` title
   - Update colors in CSS files (currently black/white)
   - Replace favicon.png with your own

2. **Add features**
   - Nutrition tracking
   - Calorie counting
   - Meal planning
   - Export to CSV

3. **Improve AI prompts**
   - Edit `src/services/gemini.ts`
   - Customize the prompt for different insights

---

## 📞 Getting Help

**If you run into issues:**

1. Check the troubleshooting section above
2. Review README.md for detailed documentation
3. Check Firebase Console for error messages
4. Check browser console (F12) for JavaScript errors
5. Verify all environment variables are correct

**Useful resources:**
- Firebase Docs: https://firebase.google.com/docs
- Gemini API Docs: https://ai.google.dev/docs
- Notion API Docs: https://developers.notion.com/
- React Docs: https://react.dev

---

## 🎉 You're Ready!

Your food logging app is complete and ready to use!

**Start with Phase 1** to get it running locally, then move to Phase 2 for production deployment.

Good luck! 🚀
