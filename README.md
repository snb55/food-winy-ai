# food.winy.ai

A minimal, Notion-style food logging web app that lets you track what you eat with photos, text, and AI-powered summaries. Automatically syncs to your Notion database.

## Features

- **Firebase Authentication** - Secure login with email/password or Google
- **Photo Upload & Camera** - Capture or upload food photos
- **AI Summaries** - Powered by Google's Gemini AI for nutritional insights
- **Notion Integration** - Auto-sync entries to your Notion database
- **Minimal Design** - Clean black and white UI inspired by Notion
- **Real-time Sync** - All data stored in Firebase Firestore

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Firebase (Auth, Firestore, Storage, Hosting)
- **AI**: Google Gemini API
- **Integration**: Notion API
- **Styling**: Custom CSS with Inter font

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Firebase account (free tier works)
- Google Cloud account (for Gemini API)
- Notion account (optional, for syncing)

### 2. Clone and Install

```bash
npm install
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable the following services:
   - **Authentication** → Enable Email/Password and Google providers
   - **Firestore Database** → Create database in production mode
   - **Storage** → Enable Firebase Storage
   - **Hosting** → Set up hosting

4. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Add web app
   - Copy the config object

### 4. Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key for Gemini
3. Copy the API key

### 5. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in your credentials in `.env`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 6. Deploy Firestore Rules & Indexes

Install Firebase CLI if you haven't:

```bash
npm install -g firebase-tools
```

Login and initialize:

```bash
firebase login
firebase use --add  # Select your project
```

Deploy security rules and indexes:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Notion Integration (Optional)

To sync your food entries to Notion:

1. **Create a Notion Integration**:
   - Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
   - Click "New integration"
   - Name it "food.winy.ai" and select your workspace
   - Copy the "Internal Integration Token"

2. **Create a Database**:
   - In Notion, create a new database with these properties:
     - `Name` (Title)
     - `Date` (Date)
     - `Summary` (Text)
     - `Photo` (URL) - optional
   - Share the database with your integration (click ••• → Add connections)
   - Copy the database ID from the URL: `notion.so/[workspace]/[DATABASE_ID]?v=...`

3. **Configure in App**:
   - Log into food.winy.ai
   - Go to Settings
   - Paste your Integration Token and Database ID
   - Save settings

All new entries will automatically sync to Notion!

## Deployment to Firebase Hosting

### Build the app:

```bash
npm run build
```

### Deploy to food.winy.ai:

```bash
firebase deploy --only hosting
```

### Custom Domain Setup:

1. In Firebase Console → Hosting → Add custom domain
2. Enter `food.winy.ai`
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning (can take up to 24 hours)

## Project Structure

```
src/
├── components/        # React components
│   ├── AddEntryModal.tsx
│   ├── AddEntryModal.css
│   ├── EntryCard.tsx
│   └── EntryCard.css
├── pages/            # Page components
│   ├── Login.tsx
│   ├── Login.css
│   ├── Feed.tsx
│   ├── Feed.css
│   ├── Settings.tsx
│   └── Settings.css
├── services/         # API integrations
│   ├── firestore.ts  # Firestore operations
│   ├── gemini.ts     # Gemini AI integration
│   └── notion.ts     # Notion API integration
├── hooks/            # Custom React hooks
│   └── useAuth.ts    # Authentication hook
├── config/           # Configuration
│   └── firebase.ts   # Firebase initialization
├── types/            # TypeScript types
│   └── index.ts      # Shared type definitions
├── App.tsx           # Main app component
├── App.css           # Global styles
└── main.tsx          # App entry point
```

## Key Files

- `firebase.json` - Firebase hosting configuration
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore query indexes
- `storage.rules` - Firebase Storage security rules
- `.env.example` - Environment variables template

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- Comprehensive JSDoc comments
- Minimal, accessible UI design
- Black and white color scheme only
- Inter font family

## Features in Detail

### Authentication
- Email/password signup and login
- Google OAuth integration
- Protected routes with automatic redirects
- Persistent authentication state

### Food Entry Creation
- Take photo with device camera
- Upload existing photos
- Text descriptions
- AI-generated summaries with nutritional insights
- Automatic timestamp

### AI Summary
Uses Gemini AI to analyze:
- What was eaten
- Nutritional highlights
- Meal type classification (breakfast/lunch/dinner/snack)

### Notion Sync
Automatically creates Notion pages with:
- Entry text as title
- Date timestamp
- AI summary
- Embedded photo

## Security

- Firestore rules restrict users to their own data
- Storage rules enforce user-specific uploads
- API keys secured via environment variables
- All connections use HTTPS

## Troubleshooting

### "Firebase API key not configured"
- Make sure `.env` file exists with all required variables
- Restart the dev server after creating `.env`

### "Failed to sync to Notion"
- Verify your Notion integration token is valid
- Check that the database is shared with the integration
- Ensure database has the required properties (Name, Date, Summary)

### Photos not uploading
- Check Firebase Storage is enabled in your project
- Verify storage rules are deployed: `firebase deploy --only storage:rules`

### Firestore permission denied
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Ensure user is logged in

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
