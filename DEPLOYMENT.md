# Deployment Checklist for food.winy.ai

Follow this checklist to deploy to production at food.winy.ai.

## Pre-Deployment

- [ ] All environment variables configured in `.env`
- [ ] Firebase project created and configured
- [ ] Firestore security rules tested
- [ ] Storage security rules tested
- [ ] Authentication providers enabled (Email + Google)
- [ ] Gemini API key obtained and tested
- [ ] App builds successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] All features tested locally

## Firebase Setup

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Project

```bash
firebase use --add
```

Select your Firebase project from the list.

### 4. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules
```

**Important**: Always deploy rules before deploying the app to ensure data security.

## Build and Deploy

### 1. Build the App

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### 2. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

### 3. Verify Deployment

Firebase will provide a URL. Visit it to verify the deployment.

## Custom Domain Setup

### 1. Add Custom Domain in Firebase Console

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter `food.winy.ai`

### 2. Configure DNS

Add these DNS records at your domain registrar:

```
Type: A
Name: food.winy.ai
Value: [IP provided by Firebase]

Type: A
Name: food.winy.ai
Value: [IP provided by Firebase]
```

For CNAME:
```
Type: CNAME
Name: www
Value: food.winy.ai
```

### 3. Wait for SSL Certificate

Firebase automatically provisions an SSL certificate. This can take up to 24 hours.

## Post-Deployment

- [ ] Test login with email/password
- [ ] Test Google authentication
- [ ] Create a test food entry
- [ ] Upload a photo
- [ ] Verify AI summary generation
- [ ] Test Notion sync (if configured)
- [ ] Check all pages load correctly
- [ ] Test on mobile devices
- [ ] Verify favicon displays correctly
- [ ] Check performance in browser DevTools

## Environment Variables for Production

**Important**: Never commit `.env` to version control!

For CI/CD, set these as environment secrets:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GEMINI_API_KEY`

## Monitoring

### Firebase Console

Monitor these in Firebase Console:

1. **Authentication** - User signups and logins
2. **Firestore** - Database usage and queries
3. **Storage** - File uploads and storage usage
4. **Hosting** - Traffic and performance

### Analytics (Optional)

Enable Firebase Analytics in the Firebase Console for user behavior tracking.

## Rollback

If issues occur, you can rollback to a previous deployment:

```bash
firebase hosting:rollback
```

## Continuous Deployment

For automatic deployments, set up GitHub Actions:

1. Create `.github/workflows/deploy.yml`
2. Add Firebase token as GitHub secret
3. Configure workflow to deploy on push to main

## Troubleshooting

### Build Fails
- Check for TypeScript errors: `npm run build`
- Verify all dependencies installed: `npm install`

### Rules Deployment Fails
- Validate `firestore.rules` syntax
- Validate `storage.rules` syntax
- Check Firebase project permissions

### Custom Domain Not Working
- Verify DNS records propagated (use `dig` or online DNS checker)
- Wait 24-48 hours for SSL certificate
- Check Firebase Console for domain status

### App Loads but Features Don't Work
- Verify environment variables are set correctly
- Check browser console for errors
- Verify Firebase services are enabled
- Check Firestore and Storage rules

## Security Best Practices

- [ ] Never expose API keys in client code (except Firebase client keys)
- [ ] Keep `.env` out of version control
- [ ] Regularly review Firestore and Storage rules
- [ ] Monitor Firebase Console for unusual activity
- [ ] Enable App Check for additional security (optional)
- [ ] Use Firebase Security Rules simulator to test rules

## Performance Optimization

- [ ] Enable gzip compression (Firebase Hosting does this automatically)
- [ ] Consider code splitting for large bundles
- [ ] Optimize images before upload
- [ ] Use Firebase Performance Monitoring
- [ ] Enable caching headers (configured in `firebase.json`)

## Cost Management

Firebase free tier includes:
- 50,000 document reads/day
- 20,000 document writes/day
- 1GB storage
- 10GB hosting bandwidth/month

Monitor usage in Firebase Console → Usage and billing.

## Support

For issues:
1. Check [README.md](./README.md) troubleshooting section
2. Review Firebase documentation
3. Check Firebase Console for error messages
4. Open an issue on GitHub

---

**Ready to deploy?** Run `npm run build && firebase deploy --only hosting`
