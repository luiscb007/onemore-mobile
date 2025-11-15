import { apiClient } from './client';
import { tokenStorage } from '../services/tokenStorage';
import type { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  birthday?: Date | null;
}

export interface AppleSignInCredentials {
  identityToken: string;
  user: string;
  email: string | null;
  fullName: {
    givenName: string | null;
    familyName: string | null;
  } | null;
}

export interface GoogleSignInCredentials {
  idToken: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  email?: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    const { token, refreshToken, user } = response.data;
    
    await tokenStorage.saveToken(token);
    if (refreshToken) {
      await tokenStorage.saveRefreshToken(refreshToken);
    }
    
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
    const response = await apiClient.post('/auth/register', credentials);
    // New flow: registration returns message, not token (user must verify email first)
    return response.data;
  },

  appleSignIn: async (credentials: AppleSignInCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/apple', credentials);
    const { token, refreshToken, user } = response.data;
    
    await tokenStorage.saveToken(token);
    if (refreshToken) {
      await tokenStorage.saveRefreshToken(refreshToken);
    }
    
    return response.data;
  },

  googleSignIn: async (credentials: GoogleSignInCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/google', credentials);
    const { token, refreshToken, user } = response.data;
    
    await tokenStorage.saveToken(token);
    if (refreshToken) {
      await tokenStorage.saveRefreshToken(refreshToken);
    }
    
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await tokenStorage.clearTokens();
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await apiClient.get('/auth/user');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await tokenStorage.clearTokens();
      }
      return null;
    }
  },

  updateUserLocation: async (latitude: number, longitude: number): Promise<void> => {
    await apiClient.post('/user/location', { latitude, longitude });
  },

  updateSearchRadius: async (radius: number): Promise<void> => {
    await apiClient.put('/user/search-radius', { radius });
  },

  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },
};
