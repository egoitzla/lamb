/**
 * LAMB Creator Interface auth endpoints.
 * Mirrors frontend/svelte-app/src/lib/services/authService.js.
 */
import { lambRequest } from './http';
import type { LambSession, LambUser } from '../types';

/**
 * Logs in with email and password. The endpoint answers 200 with `success: false`
 * on wrong credentials, which {@link lambRequest} turns into an error.
 * @param serverUrl - Already normalized base URL
 */
export async function login(
  serverUrl: string,
  email: string,
  password: string,
): Promise<LambSession> {
  const body = new FormData();
  body.append('email', email);
  body.append('password', password);

  const { token, ...user } = await lambRequest<LambUser & { token: string }>(
    `${serverUrl}/creator/login`,
    { method: 'POST', body, errorMessage: 'Login failed.' },
  );
  return { serverUrl, token, user };
}

/** Fetches the profile of the token's owner. Used to check a stored session is still valid. */
export function fetchMe(serverUrl: string, token: string): Promise<LambUser> {
  return lambRequest<LambUser>(`${serverUrl}/creator/me`, {
    token,
    errorMessage: 'Could not load your profile.',
  });
}
