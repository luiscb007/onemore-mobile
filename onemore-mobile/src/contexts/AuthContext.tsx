import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth';
import { tokenStorage } from '../services/tokenStorage';
import type { User } from '../types';
import type { LoginCredentials, RegisterCredentials, AppleSignInCredentials } from '../api/auth';

type UserRole = 'attendee' | 'organizer';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  userRole: UserRole;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<{ message: string; email?: string }>;
  appleSignIn: (credentials: AppleSignInCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = '@onemore_user_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRoleState] = useState<UserRole>('attendee');

  const loadUser = async () => {
    try {
      const token = await tokenStorage.getToken();
      if (token) {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      }
      
      const savedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
      if (savedRole === 'organizer' || savedRole === 'attendee') {
        setUserRoleState(savedRole);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      await tokenStorage.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error('Apple Sign In failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
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

  return (
    <AuthContext.Provider value={{ user, loading, userRole, login, register, appleSignIn, logout, refreshUser, setUserRole }}>
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
