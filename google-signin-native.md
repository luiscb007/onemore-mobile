# Native Google Sign In Implementation Guide

## Overview
This guide explains how to switch from web-based Google Sign In (expo-auth-session) to native iOS SDK (@react-native-google-signin/google-signin) for production builds.

**Current Implementation:** Web-based OAuth (works in Expo Go)  
**Production Implementation:** Native iOS SDK (requires development/production build)

## Why Switch to Native?
- ✅ Better UX - In-app sign-in flow instead of browser redirect
- ✅ Faster authentication - No context switching
- ✅ Native iOS experience - Matches Apple Sign In flow
- ❌ Requires Expo development build (doesn't work in Expo Go)

## Prerequisites

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select your project
3. Enable Google Sign-In API
4. Create OAuth 2.0 credentials:
   - **Web Client ID** (for ID tokens): `861823949799-8t14k06iqkr4v7gvflv4lc6uc0q40k6k.apps.googleusercontent.com`
   - **iOS Client ID**: `861823949799-benbjhbbkbd7lnu2p0mknv6uutfp6ieu.apps.googleusercontent.com`
5. Download `GoogleService-Info.plist` (place in project root)

### 2. Expo Development Build
```bash
# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Build for iOS
eas build --profile development --platform ios
```

## Implementation Steps

### Step 1: Install Native Package
```bash
cd onemore-mobile
npm uninstall expo-auth-session expo-web-browser
npm install @react-native-google-signin/google-signin
```

### Step 2: Update WelcomeScreen.tsx

Replace the web-based OAuth imports and implementation:

```typescript
// Remove these imports
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Add this import
import { GoogleSignin } from '@react-native-google-signin/google-signin';
```

Add configuration in useEffect:
```typescript
useEffect(() => {
  GoogleSignin.configure({
    webClientId: '861823949799-8t14k06iqkr4v7gvflv4lc6uc0q40k6k.apps.googleusercontent.com',
    iosClientId: '861823949799-benbjhbbkbd7lnu2p0mknv6uutfp6ieu.apps.googleusercontent.com',
  });
}, []);
```

Replace handleGoogleSignIn function:
```typescript
const handleGoogleSignIn = async () => {
  try {
    setIsGoogleLoading(true);
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    
    // Check if sign-in was successful
    if (response.type === 'success') {
      const { idToken } = response.data;
      if (idToken) {
        await googleSignIn({ idToken });
      } else {
        throw new Error('No ID token received from Google. Make sure webClientId is configured.');
      }
    }
    // User cancelled - type would be 'cancelled', just return without error
  } catch (error: any) {
    if (error.code === 'SIGN_IN_CANCELLED') {
      // User cancelled the sign-in
      return;
    }
    console.error('Google Sign In error:', error);
    Alert.alert('Error', 'Google Sign In failed. Please try again.');
  } finally {
    setIsGoogleLoading(false);
  }
};
```

### Step 3: Update app.json

Remove the expo-auth-session redirect URI:
```json
{
  "expo": {
    "scheme": "onemore",
    "ios": {
      "bundleIdentifier": "com.onemore.app",
      "infoPlist": {
        // Keep existing permissions
      }
    }
  }
}
```

### Step 4: Test on Development Build

1. Install the development build on your device/simulator
2. Test Google Sign In flow
3. Verify backend receives and validates the ID token
4. Confirm auto-login works after closing the app

## Backend Configuration

The backend is already configured! No changes needed:

- `/api/auth/google` endpoint accepts `{ idToken }` payload
- Uses `google-auth-library` to verify tokens
- Checks `email_verified` claim for security
- Auto-creates verified users (bypasses email verification)

## Reverting to Web-Based (for Expo Go testing)

If you need to switch back to web-based for Expo Go:

```bash
cd onemore-mobile
npm uninstall @react-native-google-signin/google-signin
npm install expo-auth-session expo-web-browser
```

Then use the web-based implementation (current code in the repo).

## Security Notes

✅ Native SDK provides better security than web-based OAuth:
- No URL scheme hijacking risk
- Token exchange happens in-app
- Uses Apple's secure keychain for credentials
- No browser cookies or redirects

✅ Backend validates all tokens with Google's public keys  
✅ Only accepts `email_verified: true` claims  
✅ Prevents account takeover with verified email linking

## Production Checklist

- [ ] Google Cloud Console configured with web + iOS client IDs
- [ ] GoogleService-Info.plist added to project root
- [ ] app.json updated with iOS configuration
- [ ] Native package installed (@react-native-google-signin/google-signin)
- [ ] WelcomeScreen.tsx updated with native implementation
- [ ] Development/Production build created with EAS
- [ ] Tested on physical iOS device
- [ ] Verified backend token validation works
- [ ] Confirmed auto-login after app restart

## Troubleshooting

**Error: "RNGoogleSignin could not be found"**
- You're using Expo Go - this requires a development build
- Run `eas build --profile development --platform ios`

**Error: "No ID token received"**
- Verify webClientId is correct (WEB type client ID)
- Check Google Cloud Console credentials configuration

**Error: "Token verification failed" (backend)**
- Ensure backend audience matches web client ID
- Check that email_verified claim is true

## Additional Resources

- [Google Sign In Docs](https://react-native-google-signin.github.io/docs/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Google Cloud Console](https://console.cloud.google.com)
