import axios from 'axios';
import { tokenStorage } from '../services/tokenStorage';

const getApiBaseUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const refreshClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (refreshToken) {
          const response = await refreshClient.post('/auth/refresh', {
            refreshToken,
          });

          const { token } = response.data;
          await tokenStorage.saveToken(token);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        await tokenStorage.clearTokens();
        return Promise.reject(refreshError);
      }
    }

    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
