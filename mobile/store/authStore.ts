import { create } from 'zustand';
import { storage } from '../services/storage';
import api from '../services/api';

interface User {
  _id: string;
  email: string;
  name: string;
  tier: 'FREE' | 'PREMIUM' | 'BUSINESS';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  // NOTE: When mobile can't reach the API (LAN / firewall / wrong host), axios usually throws
  // ECONNABORTED (timeout) or a generic Network Error. We surface baseURL to make debugging easier.

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const { data } = await api.post('/auth/login', { email, password });
      const payload = data?.data;
      if (!payload?.accessToken || !payload?.refreshToken || !payload?.user) {
        throw new Error('Login failed');
      }

      await storage.setItem('accessToken', payload.accessToken);
      await storage.setItem('refreshToken', payload.refreshToken);

      set({ user: payload.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      const backendMessage = error.response?.data?.error?.message || error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const code = error?.code;
      const baseURL = error?.config?.baseURL;
      const isTimeout = code === 'ECONNABORTED' || /timeout/i.test(String(error?.message));
      const isNetworkError = /network error/i.test(String(error?.message));

      if (isTimeout || isNetworkError) {
        const hint =
          `Brak połączenia z API (${baseURL ?? 'unknown'}). ` +
          `Sprawdź czy telefon i komputer są w tej samej sieci Wi‑Fi, ` +
          `czy nie masz VPN, oraz czy firewall nie blokuje portu 3000.`;
        throw new Error(hint);
      }

      throw new Error(error?.message || 'Login failed');
    }
  },

  register: async (name: string, email: string, password: string) => {
    try {
      set({ isLoading: true });
      const { data } = await api.post('/auth/register', { name, email, password });
      const payload = data?.data;
      if (!payload?.accessToken || !payload?.refreshToken || !payload?.user) {
        throw new Error('Registration failed');
      }

      await storage.setItem('accessToken', payload.accessToken);
      await storage.setItem('refreshToken', payload.refreshToken);

      set({ user: payload.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      const backendMessage = error.response?.data?.error?.message || error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const code = error?.code;
      const baseURL = error?.config?.baseURL;
      const isTimeout = code === 'ECONNABORTED' || /timeout/i.test(String(error?.message));
      const isNetworkError = /network error/i.test(String(error?.message));

      if (isTimeout || isNetworkError) {
        const hint =
          `Brak połączenia z API (${baseURL ?? 'unknown'}). ` +
          `Sprawdź czy telefon i komputer są w tej samej sieci Wi‑Fi, ` +
          `czy nie masz VPN, oraz czy firewall nie blokuje portu 3000.`;
        throw new Error(hint);
      }

      throw new Error(error?.message || 'Registration failed');
    }
  },

  logout: async () => {
    try {
      const refreshToken = await storage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storage.removeItem('accessToken');
      await storage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false });
    }
  },

  loadUser: async () => {
    try {
      const token = await storage.getItem('accessToken');
      if (!token) {
        set({ isAuthenticated: false });
        return;
      }
      
      const { data } = await api.get('/auth/me');
      const user = data?.data;
      set({ user: user || null, isAuthenticated: !!user });
    } catch (error) {
      console.error('Load user error:', error);
      set({ isAuthenticated: false });
    }
  },
}));
