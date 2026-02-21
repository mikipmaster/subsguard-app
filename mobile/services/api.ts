import axios from 'axios';
import Constants from 'expo-constants';
import { storage } from './storage';

const isWeb = typeof window !== 'undefined' && !!window.location;

const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (isWeb) {
    const host = window.location.hostname;
    return `http://${host}:3000/api`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const debuggerHost = (Constants as any).expoConfig?.debuggerHost ?? (Constants as any).manifest2?.extra?.expoClient?.debuggerHost;
  const rawHost = hostUri ?? debuggerHost;

  const hostname = typeof rawHost === 'string' ? rawHost.split(':')[0] : null;
  if (hostname) return `http://${hostname}:3000/api`;

  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

console.log('🔗 API URL:', API_URL);

const API_TIMEOUT_MS = isWeb ? 10000 : 30000;

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
    const token = await storage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    const errorPayload = {
      status: error.response?.status,
      message: error.message,
      code: error.code,
      baseURL: error.config?.baseURL,
      url: error.config?.url,
      method: error.config?.method,
    };
    console.error('❌ Response error:', errorPayload);
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
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
