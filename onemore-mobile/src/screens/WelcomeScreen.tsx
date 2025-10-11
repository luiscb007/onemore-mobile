import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

// Conditionally import Google Sign In (only works in standalone builds, not Expo Go)
// Constants.appOwnership values:
// - 'standalone': App built with EAS/expo build (has native modules)
// - 'expo' | 'guest' | null: Expo Go or published project (no native modules)
const isStandaloneBuild = Constants.appOwnership === 'standalone';
let GoogleSignin: any = null;

if (isStandaloneBuild) {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  } catch (error) {
    console.warn('Google Sign In module could not be loaded:', error);
  }
}

type WelcomeScreenProps = {
  navigation: any;
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { appleSignIn, googleSignIn } = useAuth();
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isGoogleAvailable = GoogleSignin !== null;

  useEffect(() => {
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: '861823949799-8t14k06iqkr4v7gvflv4lc6uc0q40k6k.apps.googleusercontent.com',
        iosClientId: '861823949799-benbjhbbkbd7lnu2p0mknv6uutfp6ieu.apps.googleusercontent.com',
      });
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      
      if (tokens.idToken) {
        await googleSignIn({ idToken: tokens.idToken });
      } else {
        throw new Error('No ID token received from Google. Make sure webClientId is configured.');
      }
    } catch (error: any) {
      if (error.code === 'SIGN_IN_CANCELLED') {
        return;
      }
      console.error('Google Sign In error:', error);
      Alert.alert('Error', 'Google Sign In failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsAppleLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      await appleSignIn({
        identityToken: credential.identityToken!,
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
      });
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Apple Sign In error:', error);
      Alert.alert('Error', 'Apple Sign In failed. Please try again.');
    } finally {
      setIsAppleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🎉 OneMore</Text>
          <Text style={styles.tagline}>Discover local events near you</Text>
        </View>

        <View style={styles.buttonsContainer}>
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}

          {isAppleLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}

          {isGoogleAvailable && (
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.googleButtonText}>🔵 Continue with Google</Text>
              )}
            </TouchableOpacity>
          )}
          
          {!isGoogleAvailable && (
            <View style={styles.expoGoNotice}>
              <Text style={styles.expoGoText}>
                ℹ️ Google Sign In requires a standalone build (not available in Expo Go)
              </Text>
            </View>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.emailButtonText}>📧 Sign Up with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkBold}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
  },
  appleButton: {
    width: '100%',
    height: 56,
    marginBottom: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emailButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginLinkText: {
    fontSize: 15,
    color: '#64748b',
  },
  loginLinkBold: {
    fontWeight: '600',
    color: '#ef4444',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  expoGoNotice: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  expoGoText: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 18,
  },
});
