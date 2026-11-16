import { NetworkError, SessionExpiredError } from './errors';

export interface LambRequestOptions {
  method?: 'GET' | 'POST';
  body?: BodyInit;
  /** Bearer token; a 401 then means the session expired */
  token?: string;
  /** Fallback message when the server gives none */
  errorMessage: string;
}

/** The `{ success, data, error }` envelope returned by Creator Interface endpoints. */
interface LambEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: string;
  detail?: string;
}

/**
 * Calls a Creator Interface endpoint and unwraps its `{ success, data, error }` envelope.
 * @returns The `data` field of the response.
 */
export async function lambRequest<T>(
  url: string,
  { method = 'GET', body, token, errorMessage }: LambRequestOptions,
): Promise<T> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  let response: Response;
  try {
    response = await fetch(url, { method, body, headers });
  } catch {
    throw new NetworkError();
  }

  if (token && response.status === 401) throw new SessionExpiredError();

  const payload = await readJson<LambEnvelope<T>>(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || payload.detail || errorMessage);
  }
  return payload.data as T;
}

/** Parses a JSON body, tolerating empty or non-JSON responses. */
async function readJson<T extends object>(response: Response): Promise<Partial<T>> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}
