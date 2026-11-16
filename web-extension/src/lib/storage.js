/**
 * Persistent extension state, kept in `browser.storage.local`.
 */
import { storage } from '#imports';
import { DEFAULT_SERVER_URL } from './config.js';

/** @typedef {import('./types.js').LambSession} LambSession */

/** Current session, or null when logged out. */
export const sessionItem = storage.defineItem(
  'local:session',
  /** @type {{ fallback: LambSession | null }} */ ({ fallback: null }),
);

/** Last server URL used, kept after logout so the form is prefilled. */
export const serverUrlItem = storage.defineItem('local:serverUrl', {
  fallback: DEFAULT_SERVER_URL,
});
