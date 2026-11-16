import { fetchMe, login } from './api/auth';
import { SessionExpiredError } from './api/errors';
import { DEFAULT_SERVER_URL } from './config';
import { serverUrlItem, sessionItem } from './storage';
import type { LambSession } from './types';
import { normalizeServerUrl } from './url';

type AuthStatus = 'loading' | 'logged-out' | 'logged-in';

/** Reactive auth state shared by the side panel components. */
class AuthState {
  status = $state<AuthStatus>('loading');

  session = $state.raw<LambSession | null>(null);

  /** Server URL to prefill the login form with. */
  serverUrl = $state(DEFAULT_SERVER_URL);

  /** Message shown on the login form (e.g. expired session). */
  notice = $state<string | null>(null);

  /** Restores the stored session and checks the token is still valid. */
  async init(): Promise<void> {
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

  /** Rejects with a user-facing message on failure. */
  async login(rawServerUrl: string, email: string, password: string): Promise<void> {
    const serverUrl = normalizeServerUrl(rawServerUrl);
    const session = await login(serverUrl, email.trim(), password);
    await Promise.all([sessionItem.setValue(session), serverUrlItem.setValue(serverUrl)]);
    this.serverUrl = serverUrl;
    this.session = session;
    this.notice = null;
    this.status = 'logged-in';
  }

  async logout(notice: string | null = null): Promise<void> {
    await sessionItem.removeValue();
    this.session = null;
    this.notice = notice;
    this.status = 'logged-out';
  }
}

export const auth = new AuthState();
