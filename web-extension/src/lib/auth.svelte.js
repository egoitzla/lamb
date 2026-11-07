import { fetchMe, login, normalizeServerUrl, SessionExpiredError } from './lambApi.js';
import { DEFAULT_SERVER_URL, serverUrlItem, sessionItem } from './session.js';

/** @typedef {import('./lambApi.js').LambSession} LambSession */

/** Reactive auth state shared by the popup components. */
class AuthState {
  /** @type {'loading' | 'logged-out' | 'logged-in'} */
  status = $state('loading');

  /** @type {LambSession | null} */
  session = $state.raw(null);

  /** Server URL to prefill the login form with. */
  serverUrl = $state(DEFAULT_SERVER_URL);

  /** @type {string | null} Message shown on the login form (e.g. expired session). */
  notice = $state(null);

  /** Restores the stored session and checks the token is still valid. */
  async init() {
    this.serverUrl = await serverUrlItem.getValue();
    const stored = await sessionItem.getValue();
    if (!stored) {
      this.status = 'logged-out';
      return;
    }

    // Show the stored session right away, then refresh it in the background.
    this.session = stored;
    this.status = 'logged-in';
    try {
      const user = await fetchMe(stored.serverUrl, stored.token);
      this.session = { ...stored, user };
      await sessionItem.setValue(this.session);
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        await this.logout(error.message);
      }
      // Network errors keep the stored session: the server may just be down.
    }
  }

  /**
   * @param {string} rawServerUrl
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>} Rejects with a user-facing message on failure.
   */
  async login(rawServerUrl, email, password) {
    const serverUrl = normalizeServerUrl(rawServerUrl);
    const session = await login(serverUrl, email.trim(), password);
    await Promise.all([sessionItem.setValue(session), serverUrlItem.setValue(serverUrl)]);
    this.serverUrl = serverUrl;
    this.session = session;
    this.notice = null;
    this.status = 'logged-in';
  }

  /** @param {string | null} [notice] */
  async logout(notice = null) {
    await sessionItem.removeValue();
    this.session = null;
    this.notice = notice;
    this.status = 'logged-out';
  }
}

export const auth = new AuthState();
