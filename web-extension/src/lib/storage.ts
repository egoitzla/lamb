/**
 * Persistent extension state, kept in `browser.storage.local`.
 */
import { storage } from '#imports';
import { DEFAULT_SERVER_URL } from './config';
import type { LambSession } from './types';

/** Current session, or null when logged out. */
export const sessionItem = storage.defineItem<LambSession | null>('local:session', {
  fallback: null,
});

/** Last server URL used, kept after logout so the form is prefilled. */
export const serverUrlItem = storage.defineItem<string>('local:serverUrl', {
  fallback: DEFAULT_SERVER_URL,
});
