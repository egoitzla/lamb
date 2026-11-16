/** Raised when the LAMB server cannot be reached at all (DNS, CORS, server down…). */
export class NetworkError extends Error {
  constructor() {
    super('Could not reach the LAMB server. Check the URL and that it is running.');
    this.name = 'NetworkError';
  }
}

/** Raised when the stored token is no longer accepted by the server. */
export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please log in again.');
    this.name = 'SessionExpiredError';
  }
}
