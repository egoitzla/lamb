/**
 * LAMB Creator Interface auth endpoints.
 * Mirrors frontend/svelte-app/src/lib/services/authService.js.
 */
import { lambRequest } from './http.js';

/** @typedef {import('../types.js').LambUser} LambUser */
/** @typedef {import('../types.js').LambSession} LambSession */

/**
 * Logs in with email and password. The endpoint answers 200 with `success: false`
 * on wrong credentials, which {@link lambRequest} turns into an error.
 * @param {string} serverUrl - Already normalized base URL
 * @param {string} email
 * @param {string} password
 * @returns {Promise<LambSession>}
 */
export async function login(serverUrl, email, password) {
  const body = new FormData();
  body.append('email', email);
  body.append('password', password);

  const { token, ...user } = await lambRequest(`${serverUrl}/creator/login`, {
    method: 'POST',
    body,
    errorMessage: 'Login failed.',
  });
  return { serverUrl, token, user };
}

/**
 * Fetches the profile of the token's owner. Used to check a stored session is still valid.
 * @param {string} serverUrl
 * @param {string} token
 * @returns {Promise<LambUser>}
 */
export function fetchMe(serverUrl, token) {
  return lambRequest(`${serverUrl}/creator/me`, {
    token,
    errorMessage: 'Could not load your profile.',
  });
}
