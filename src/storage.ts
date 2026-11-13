import {lessons} from './content/lessons';
import {SESSION_KEY, parseSession} from './session';

/** Browser storage is optional: private windows and blocked site data must not break the app. */
export function getSaved(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* local storage optional */
  }
}

export function readSession() {
  return parseSession(getSaved(SESSION_KEY, '') || null, lessons);
}

export function readCompleted(): string[] {
  try {
    const v = JSON.parse(getSaved('tfv-complete', '[]'));
    return Array.isArray(v)
      ? v.filter((x: unknown) => typeof x === 'string' && lessons.some(l => l.id === x))
      : [];
  } catch {
    return [];
  }
}
