# Production Deployment Guide

## Pre-TestFlight Checklist

### 1. Backend Configuration ✅

The backend is production-ready with:
- **CORS enabled** for mobile app access (JWT bearer token authentication)
- **JWT_SECRET** configured in environment variables
- **LOCATIONIQ_API_KEY** configured for address autocomplete
- **Email verification** using Replit Mail
- **Rate limiting** on all endpoints
- **Content safety** (profanity filter, HTML sanitization)

### 2. Mobile App Configuration ✅

Current setup:
- **App name**: OneMore
- **Bundle ID**: com.onemore.app
- **Authentication**: Apple Sign In, Google Sign In (native), Email
- **API URL**: Configured via `EXPO_PUBLIC_API_URL` environment variable

### 3. Environment Variables

#### Backend (Replit Secrets)
Already configured:
- `JWT_SECRET` - Used for JWT token signing/verification
- `LOCATIONIQ_API_KEY` - Used for address autocomplete
- `DATABASE_URL` - PostgreSQL connection (Neon)

#### Mobile App (.env file)
Current configuration:
```bash
EXPO_PUBLIC_API_URL=https://daade1d6-9389-485f-990e-56c4b4974a06-00-e3z49q9vb39k.janeway.replit.dev
```

**For production/TestFlight builds**, you'll need to update this to your published Replit deployment URL once you deploy.

### 4. Google Cloud Console Setup

Before building for TestFlight, complete the Google Sign In setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to your project
3. Go to **APIs & Services > Credentials**
4. Verify/create iOS Client ID:
   - **Type**: iOS
   - **Bundle ID**: `com.onemore.app`
5. Ensure Web Client ID exists (for ID token validation)
6. Download the `GoogleService-Info.plist` if needed

See `GOOGLE_CLOUD_SETUP.md` for detailed instructions.

## Building for TestFlight

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

### Step 3: Build for iOS (Preview/TestFlight)

```bash
cd onemore-mobile
eas build --profile preview --platform ios
```

During the build:
- EAS will ask for your **Apple Developer credentials**
- You'll need to provide your **iPhone UDID** (device identifier)
- Build takes ~15-20 minutes
- You'll get a download link or can upload directly to TestFlight

### Step 4: Install on iPhone

1. Download the `.ipa` file or upload to TestFlight
2. Install via TestFlight app on your iPhone
3. Test all features:
   - ✅ Apple Sign In
   - ✅ Google Sign In (native)
   - ✅ Email registration/login
   - ✅ Event discovery
   - ✅ Messaging
   - ✅ Ratings

## Production Deployment (Backend)

Once you're ready for production:

1. **Deploy Backend** using Replit's deployment:
   - Click "Deploy" button in Replit
   - Get your production URL (e.g., `https://onemore-production.replit.app`)

2. **Update Mobile .env**:
   ```bash
   EXPO_PUBLIC_API_URL=https://onemore-production.replit.app
   ```

3. **Rebuild for Production**:
   ```bash
   eas build --profile production --platform ios
   ```

## Security Notes

- **CORS**: Configured to allow all origins with `credentials: false` (secure for JWT bearer tokens)
- **JWT**: 7-day token expiry, secure secret in environment
- **OAuth**: Apple and Google tokens verified with provider public keys
- **Email**: Verification required before login, 24-hour token expiry
- **Rate Limiting**: Enabled on all endpoints

## Troubleshooting

### Google Sign In Not Working
- Verify iOS Client ID matches bundle identifier: `com.onemore.app`
- Check that Web Client ID is configured in WelcomeScreen.tsx
- Google Sign In requires EAS build (doesn't work in Expo Go)

### Backend Not Accessible
- Verify `EXPO_PUBLIC_API_URL` in .env matches your Replit domain
- Check that backend is deployed and running
- Test API endpoint directly: `https://your-domain/api/health`

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Clear cache: `eas build --clear-cache`
- Check build logs for specific errors

## Next Steps

After TestFlight testing:
1. Submit to App Store Review
2. Prepare App Store assets (screenshots, description, privacy policy)
3. Set up production monitoring and analytics
4. Plan Android release (90-95% code reusable)
