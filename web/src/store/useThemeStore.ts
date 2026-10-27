'use client';

import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem('carrevive_theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  setTheme: (theme: Theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('carrevive_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
      } catch {}
    }
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));

// Initialize theme on client mount
if (typeof window !== 'undefined') {
  try {
    const initial = getInitialTheme();
    useThemeStore.setState({ theme: initial });
    document.documentElement.setAttribute('data-theme', initial);
  } catch {}
}
