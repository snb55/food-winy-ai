# Quick Start Guide

Get food.winy.ai running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password + Google)
3. Create a Firestore database
4. Enable Firebase Storage
5. Copy your Firebase config

## Step 3: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy it

## Step 4: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## Step 5: Deploy Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add  # Select your project
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

## Step 6: Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Step 7: (Optional) Set Up Notion Integration

1. Create a Notion integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create a database with properties: Name (Title), Date (Date), Summary (Text)
3. Share the database with your integration
4. Add credentials in Settings page of the app

## Deploy to Production

```bash
npm run build
firebase deploy --only hosting
```

## Need Help?

See the full [README.md](./README.md) for detailed documentation.
