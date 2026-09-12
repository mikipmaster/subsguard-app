import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from './storage';

const isWeb = Platform.OS === 'web';

const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (isWeb) {
    const host = window.location.hostname;
    return `http://${host}:3000/api`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const debuggerHost =
    (Constants as any).expoConfig?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoClient?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;
  const rawHost = hostUri ?? debuggerHost;

  const hostname = typeof rawHost === 'string' ? rawHost.split(':')[0] : null;
  if (hostname) return `http://${hostname}:3000/api`;

  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

console.log('🔗 API URL:', API_URL);

const API_TIMEOUT_MS = isWeb ? 10000 : 30000;

const isPublicAuthEndpoint = (url: string) => {
  const u = String(url ?? '');
  return (
    u === '/auth/login' ||
    u === '/auth/register' ||
    u === '/auth/refresh-token' ||
    u === '/auth/logout'
  );
};

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const url = String(config.url ?? '');
    const isAuthPublic = isPublicAuthEndpoint(url);

    if (!isAuthPublic) {
      const token = await storage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    console.log('📤 Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? '');

    // Avoid noisy LogBox on app startup when stored token is invalid/expired.
    const shouldSilence = status === 401 && (url === '/auth/me' || isPublicAuthEndpoint(url));
    if (!shouldSilence) {
      const errorPayload = {
        status,
        message: error.message,
        code: error.code,
        baseURL: error.config?.baseURL,
        url,
        method: error.config?.method,
      };
      console.error('❌ Response error:', errorPayload);
    }
    
    const originalRequest = error.config;

    const originalUrl = String(originalRequest?.url ?? '');
    const isAuthPublic = isPublicAuthEndpoint(originalUrl);

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthPublic) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data: responseBody } = await api.post('/auth/refresh-token', {
          refreshToken,
        });

        const tokens = responseBody?.data;
        if (!tokens?.accessToken || !tokens?.refreshToken) {
          throw new Error('Refresh token failed');
        }

        await storage.setItem('accessToken', tokens.accessToken);
        await storage.setItem('refreshToken', tokens.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await storage.removeItem('accessToken');
        await storage.removeItem('refreshToken');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
