import { storage } from './local-storage';

export type Theme = 'dark' | 'light' | 'system';

export function loadTheme(): Theme {
  const stored = storage.loadTheme();
  if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  return 'system';
}

export function saveTheme(theme: Theme): void {
  storage.saveTheme(theme);
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}
