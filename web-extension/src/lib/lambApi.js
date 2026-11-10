/**
 * Minimal client for the LAMB Creator Interface (`/creator`) auth endpoints.
 * Mirrors frontend/svelte-app/src/lib/services/authService.js.
 */

/**
 * @typedef {Object} LambUser
 * @property {string} name
 * @property {string} email
 * @property {number} user_id
 * @property {string} role
 * @property {'creator' | 'end_user'} user_type
 * @property {string | null} organization_role
 * @property {string} launch_url
 */

/**
 * @typedef {Object} LambSession
 * @property {string} serverUrl - Normalized LAMB base URL, e.g. `http://localhost:9099`
 * @property {string} token - Bearer token returned by `/creator/login`
 * @property {LambUser} user
 */

/** Raised when the stored token is no longer accepted by the server. */
export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please log in again.');
    this.name = 'SessionExpiredError';
  }
}

/**
 * Validates a user-typed server URL and strips trailing slashes.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeServerUrl(raw) {
  /** @type {URL} */
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error('Invalid server URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('The server URL must start with http:// or https://');
  }
  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
}

/**
 * fetch() wrapper that turns network failures into a readable error.
 * @param {string} url
 * @param {RequestInit} init
 * @returns {Promise<Response>}
 */
async function request(url, init) {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error('Could not reach the LAMB server. Check the URL and that it is running.');
  }
}

/**
 * Parses a JSON body, tolerating empty or non-JSON responses.
 * @param {Response} response
 * @returns {Promise<any>}
 */
async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

/**
 * Logs in with email and password.
 * @param {string} serverUrl - Already normalized base URL
 * @param {string} email
 * @param {string} password
 * @returns {Promise<LambSession>}
 */
export async function login(serverUrl, email, password) {
  const body = new FormData();
  body.append('email', email);
  body.append('password', password);

  const response = await request(`${serverUrl}/creator/login`, { method: 'POST', body });
  const data = await readJson(response);

  // The endpoint answers 200 with `success: false` on wrong credentials.
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.detail || 'Login failed.');
  }

  const { token, ...user } = data.data;
  return { serverUrl, token, user };
}

/**
 * Fetches the profile of the token's owner. Used to check a stored session is still valid.
 * @param {string} serverUrl
 * @param {string} token
 * @returns {Promise<LambUser>}
 */
export async function fetchMe(serverUrl, token) {
  const response = await request(`${serverUrl}/creator/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new SessionExpiredError();

  const data = await readJson(response);
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.detail || 'Could not load your profile.');
  }
  return data.data;
}

/**
 * @typedef {Object} MoodleConnection
 * @property {boolean} connected - LAMB has a working Moodle connection for this creator
 * @property {string | null} baseUrl - Moodle site LAMB is connected to
 * @property {number | null} moodleUserId - Moodle user id verified when connecting
 * @property {string | null} username
 */

/**
 * Fetches the creator's Moodle connection as stored in LAMB (`GET /creator/moodle/connection`).
 * Returns null when the Moodle connector is not available on this server.
 * @param {string} serverUrl
 * @param {string} token
 * @returns {Promise<MoodleConnection | null>}
 */
export async function fetchMoodleConnection(serverUrl, token) {
  const response = await request(`${serverUrl}/creator/moodle/connection`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new SessionExpiredError();
  if (!response.ok) return null;

  const data = await readJson(response);
  const connection = data.connection ?? {};
  return {
    connected: Boolean(data.connected),
    baseUrl: connection.base_url ?? null,
    moodleUserId: connection.moodle_user_id ?? null,
    username: connection.username ?? null,
  };
}
