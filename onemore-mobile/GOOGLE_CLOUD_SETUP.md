# Google Cloud Console Setup for Native iOS Sign In

## Current Status
✅ Your app code is configured with these client IDs:
- **Web Client ID**: `178660337416-m9o2rjl5g3lshsa980tovrlvlvna8onl.apps.googleusercontent.com`
- **iOS Client ID**: `178660337416-n5gd0jm1fkfb9d0j30hrecd6cgtge5iv.apps.googleusercontent.com`

## What You Need to Do

### Step 1: Verify Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**

### Step 2: Confirm OAuth 2.0 Credentials Exist

You should see two OAuth 2.0 Client IDs:

#### Web Client ID (for ID tokens)
- **Type**: Web application
- **Client ID**: `178660337416-m9o2rjl5g3lshsa980tovrlvlvna8onl.apps.googleusercontent.com`
- **Purpose**: Backend verification of ID tokens

#### iOS Client ID (for native sign-in)
- **Type**: iOS
- **Client ID**: `178660337416-n5gd0jm1fkfb9d0j30hrecd6cgtge5iv.apps.googleusercontent.com`
- **Bundle ID**: `com.onemore.app` (must match your app.json bundleIdentifier)

### Step 3: Create iOS Client ID (if it doesn't exist)

If the iOS Client ID doesn't exist yet:

1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. Choose **iOS** as the application type
3. Enter a name: `OneMore iOS App`
4. Enter Bundle ID: `com.onemore.app`
5. Click **CREATE**
6. Copy the generated Client ID

**Important**: The iOS Client ID should be `178660337416-n5gd0jm1fkfb9d0j30hrecd6cgtge5iv.apps.googleusercontent.com` (as configured in your code)

### Step 4: Enable Required APIs

Make sure these APIs are enabled:
1. Go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Google Sign-In API** (or **Google+ API**)
   - **People API** (for profile information)

### Step 5: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Set up your app information:
   - **App name**: OneMore
   - **User support email**: Your email
   - **App logo**: Optional
   - **Authorized domains**: (leave empty for now)
   - **Developer contact**: Your email
3. Add scopes:
   - `email`
   - `profile`
   - `openid`
4. Save and continue

## Testing Checklist

Before building for iOS:
- [ ] Both Web and iOS client IDs exist in Google Cloud Console
- [ ] iOS Client ID matches `com.onemore.app` bundle identifier
- [ ] OAuth consent screen is configured
- [ ] Google Sign-In API is enabled
- [ ] Client IDs in WelcomeScreen.tsx match Google Cloud Console

## Building the iOS App

Once Google Cloud Console is set up:

### Option 1: Development Build (for testing on your device)
```bash
cd onemore-mobile
eas build --profile development --platform ios
```

### Option 2: Preview Build (for TestFlight)
```bash
cd onemore-mobile
eas build --profile preview --platform ios
```

### Option 3: Production Build (for App Store)
```bash
cd onemore-mobile
eas build --profile production --platform ios
```

## Troubleshooting

### Error: "No ID token received"
- **Cause**: webClientId is missing or incorrect
- **Fix**: Verify the Web Client ID in WelcomeScreen.tsx matches Google Cloud Console

### Error: "Developer error" or "Invalid client ID"
- **Cause**: iOS Client ID doesn't match bundle identifier
- **Fix**: Update iOS Client ID in Google Cloud Console to use bundle ID `com.onemore.app`

### Error: "Sign in failed"
- **Cause**: OAuth consent screen not configured
- **Fix**: Complete OAuth consent screen setup with required scopes

### Backend returns "Token verification failed"
- **Cause**: Backend audience doesn't match web client ID
- **Fix**: Your backend is already configured correctly with the web client ID

## Important Notes

1. **Native SDK vs Expo Go**: The native Google Sign In SDK (`@react-native-google-signin/google-signin`) does NOT work in Expo Go. You must create a development or production build using EAS.

2. **Web Client ID Required**: Even for native iOS apps, you need the web client ID for ID token generation. This is by design and required for backend verification.

3. **Bundle Identifier**: The iOS Client ID must be configured with the exact bundle identifier from app.json: `com.onemore.app`

4. **Testing**: After building, test the Google Sign In flow on a physical iOS device or simulator with the development build installed.

## Next Steps After Setup

1. Complete Google Cloud Console setup following this guide
2. Run `eas build --profile preview --platform ios` to create a TestFlight build
3. Install the build on your iPhone
4. Test Google Sign In - it should open natively without Safari
5. Verify the backend receives and validates the ID token

## Support Resources

- [Google Sign In for iOS Setup](https://developers.google.com/identity/sign-in/ios/start)
- [React Native Google Sign In Docs](https://react-native-google-signin.github.io/docs/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
