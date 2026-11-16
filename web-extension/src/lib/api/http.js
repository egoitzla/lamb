import { NetworkError, SessionExpiredError } from './errors.js';

/**
 * @typedef {Object} LambRequestOptions
 * @property {'GET' | 'POST'} [method]
 * @property {BodyInit} [body]
 * @property {string} [token] - Bearer token; a 401 then means the session expired
 * @property {string} errorMessage - Fallback message when the server gives none
 */

/**
 * Calls a Creator Interface endpoint and unwraps its `{ success, data, error }` envelope.
 * @param {string} url
 * @param {LambRequestOptions} options
 * @returns {Promise<any>} The `data` field of the response.
 */
export async function lambRequest(url, { method = 'GET', body, token, errorMessage }) {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  /** @type {Response} */
  let response;
  try {
    response = await fetch(url, { method, body, headers });
  } catch {
    throw new NetworkError();
  }

  if (token && response.status === 401) throw new SessionExpiredError();

  const payload = await readJson(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || payload.detail || errorMessage);
  }
  return payload.data;
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
