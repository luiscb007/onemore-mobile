import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth';
import { tokenStorage } from '../services/tokenStorage';
import type { User } from '../types';
import type { LoginCredentials, RegisterCredentials, AppleSignInCredentials, GoogleSignInCredentials } from '../api/auth';
import { setupPushNotifications, unregisterPushNotifications } from '../utils/notifications';

type UserRole = 'attendee' | 'organizer';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  userRole: UserRole;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<{ message: string; email?: string }>;
  appleSignIn: (credentials: AppleSignInCredentials) => Promise<void>;
  googleSignIn: (credentials: GoogleSignInCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = '@onemore_user_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[AuthProvider] AuthProvider component rendering');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRoleState] = useState<UserRole>('attendee');
  const [debugStatus, setDebugStatus] = useState<string>('Starting...');

  const loadUser = async () => {
    console.log('[AuthProvider] loadUser started');
    setDebugStatus('Loading user...');
    
    // Force timeout after 15 seconds to prevent indefinite hanging
    const timeoutId = setTimeout(() => {
      console.warn('[AuthProvider] Loading timeout reached, forcing completion');
      setDebugStatus('Connection timeout, showing login...');
      setLoading(false);
    }, 15000);
    
    try {
      console.log('[AuthProvider] Getting token from storage');
      setDebugStatus('Checking token...');
      const token = await tokenStorage.getToken();
      console.log('[AuthProvider] Token retrieved:', token ? 'exists' : 'null');
      
      if (token) {
        try {
          console.log('[AuthProvider] Fetching current user from API');
          setDebugStatus('Connecting to API...');
          const userData = await authApi.getCurrentUser();
          console.log('[AuthProvider] User data received:', userData);
          setDebugStatus('User loaded!');
          setUser(userData);
          
          // Setup push notifications for already logged in user
          setupPushNotifications().catch(console.error);
        } catch (apiError) {
          console.error('[AuthProvider] API connection failed:', apiError);
          setDebugStatus('API failed, showing login...');
          // Clear invalid token and continue to show login screen
          await tokenStorage.clearTokens();
          setUser(null);
        }
      } else {
        setDebugStatus('No token found, ready to login');
      }
      
      console.log('[AuthProvider] Getting saved role');
      setDebugStatus('Loading role...');
      const savedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
      console.log('[AuthProvider] Saved role:', savedRole);
      if (savedRole === 'organizer' || savedRole === 'attendee') {
        setUserRoleState(savedRole);
      }
      setDebugStatus('Ready!');
    } catch (error) {
      console.error('[AuthProvider] Failed to load user:', error);
      setDebugStatus(`Error: ${error}`);
      await tokenStorage.clearTokens();
      setUser(null);
    } finally {
      clearTimeout(timeoutId);
      console.log('[AuthProvider] Setting loading to false');
      setLoading(false);
      console.log('[AuthProvider] loadUser completed');
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const setUserRole = async (role: UserRole) => {
    try {
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);
      setUserRoleState(role);
    } catch (error) {
      console.error('Failed to save user role:', error);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const { user: loggedInUser } = await authApi.login(credentials);
      setUser(loggedInUser);
      
      // Setup push notifications after login
      setupPushNotifications().catch(console.error);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setLoading(true);
    try {
      // New flow: registration returns message, user must verify email before logging in
      const response = await authApi.register(credentials);
      // Do NOT set user - they need to verify email first
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const appleSignIn = async (credentials: AppleSignInCredentials) => {
    setLoading(true);
    try {
      const { user: appleUser } = await authApi.appleSignIn(credentials);
      setUser(appleUser);
      
      // Setup push notifications after Apple Sign In
      setupPushNotifications().catch(console.error);
    } catch (error) {
      console.error('Apple Sign In failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async (credentials: GoogleSignInCredentials) => {
    setLoading(true);
    try {
      const { user: googleUser } = await authApi.googleSignIn(credentials);
      setUser(googleUser);
      
      // Setup push notifications after Google Sign In
      setupPushNotifications().catch(console.error);
    } catch (error) {
      console.error('Google Sign In failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Unregister push notifications before logout
      await unregisterPushNotifications();
      
      await authApi.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  console.log('[AuthProvider] Rendering children, loading:', loading, 'user:', user ? 'exists' : 'null');
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <View style={{ padding: 20, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, marginHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>OneMore</Text>
          <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: '#666' }}>{debugStatus}</Text>
          <View style={{ height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 15, overflow: 'hidden' }}>
            <View style={{ height: '100%', backgroundColor: '#007AFF', width: '50%' }} />
          </View>
          <Text style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>Initializing...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <AuthContext.Provider value={{ user, loading, userRole, login, register, appleSignIn, googleSignIn, logout, refreshUser, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
