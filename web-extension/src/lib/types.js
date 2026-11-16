/**
 * Shared JSDoc types. This file has no runtime code.
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

export {};
