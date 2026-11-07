import { storage } from '#imports';

/** @typedef {import('./lambApi.js').LambSession} LambSession */

export const DEFAULT_SERVER_URL = 'http://localhost:9099';

/** Current session, or null when logged out. Lives in `browser.storage.local`. */
export const sessionItem = storage.defineItem(
  'local:session',
  /** @type {{ fallback: LambSession | null }} */ ({ fallback: null }),
);

/** Last server URL used, kept after logout so the form is prefilled. */
export const serverUrlItem = storage.defineItem('local:serverUrl', {
  fallback: DEFAULT_SERVER_URL,
});
