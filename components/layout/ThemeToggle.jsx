'use client';

import { useSyncExternalStore } from 'react';

import Icon from '../common/Icon';

/**
 * Toggles `data-theme` on <html> between 'light' and 'dark', persisting the
 * choice to localStorage. The attribute is first set pre-hydration by the
 * inline boot script in app/layout.js (so there's no flash of the wrong
 * theme) — this component reads it back via useSyncExternalStore, which
 * is the React-recommended way to read an external (non-React-owned)
 * mutable value like a DOM attribute without a setState-in-effect footgun:
 * it renders `getServerSnapshot()` for the first client pass (matching the
 * server, avoiding a hydration mismatch) and reconciles to the real value
 * right after mount.
 */
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function getServerSnapshot() {
  return 'light';
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    notify();
  }

  return (
    <button
      type="button"
      className="app-header__icon-button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
