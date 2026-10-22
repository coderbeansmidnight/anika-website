// Light/dark theme. The initial theme is set by an inline script in
// index.html (before paint); this module handles toggling and persistence.

export type Theme = 'light' | 'dark';

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function syncToggle(theme: Theme): void {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Storage unavailable (private mode); the toggle still works for this visit.
  }
  syncToggle(theme);
  document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

export function toggleTheme(): void {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme(): void {
  syncToggle(currentTheme());
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
}
