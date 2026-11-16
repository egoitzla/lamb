/**
 * Validates a user-typed server URL and strips trailing slashes.
 * @returns e.g. `https://lamb.example.org` or `https://example.org/lamb`
 */
export function normalizeServerUrl(raw: string): string {
  let url: URL;
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
