import { create } from 'zustand';
import type { Locale, AppPage, ByokSettings, ByokScope, User, WorkspaceTab } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));

interface UIState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  currentPage: AppPage;
  pageParams: Record<string, string>;
  navigate: (page: AppPage, params?: Record<string, string>) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (id: string | null) => void;
  workspaceTab: WorkspaceTab;
  setWorkspaceTab: (tab: WorkspaceTab) => void;
}

export const useUIStore = create<UIState>((set) => ({
  locale: 'en',
  setLocale: (locale) => set({ locale }),
  currentPage: 'login',
  pageParams: {},
  navigate: (page, params = {}) => {
    set({ currentPage: page, pageParams: params });
  },
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectedWorkspaceId: null,
  setSelectedWorkspaceId: (id) => set({ selectedWorkspaceId: id }),
  workspaceTab: 'status',
  setWorkspaceTab: (tab) => set({ workspaceTab: tab }),
}));

interface ByokState {
  apiKey: string;
  scope: ByokScope;
  setApiKey: (key: string) => void;
  setScope: (scope: ByokScope) => void;
  clearKey: () => void;
  getMaskedKey: () => string;
  getSettings: () => ByokSettings;
}

export const useByokStore = create<ByokState>((set, get) => ({
  apiKey: '',
  scope: 'both',
  setApiKey: (key) => set({ apiKey: key }),
  setScope: (scope) => set({ scope }),
  clearKey: () => set({ apiKey: '' }),
  getMaskedKey: () => {
    const key = get().apiKey;
    if (!key) return '';
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.slice(0, 3) + '...' + key.slice(-4);
  },
  getSettings: () => {
    const { apiKey, scope } = get();
    return {
      api_key_masked: apiKey ? apiKey.slice(0, 3) + '...' + apiKey.slice(-4) : '',
      scope,
    };
  },
}));