import { NetworkError, SessionExpiredError } from './errors';

export interface LambRequestOptions {
  method?: 'GET' | 'POST';
  body?: BodyInit;
  /** Bearer token; a 401 then means the session expired */
  token?: string;
  /** Fallback message when the server gives none */
  errorMessage: string;
}

/**
 * The `{ success, data, error }` envelope returned by some Creator Interface endpoints.
 * Others return their JSON as is and report errors as HTTP errors with `{ detail }`.
 */
interface LambEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: string;
  detail?: string;
}

/**
 * Calls a Creator Interface endpoint that wraps its result in a `{ success, data, error }`
 * envelope (e.g. `/creator/login`, `/creator/me`).
 * @returns The `data` field of the response.
 */
export async function lambRequest<T>(url: string, options: LambRequestOptions): Promise<T> {
  const { response, payload } = await send<LambEnvelope<T>>(url, options);
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || payload.detail || options.errorMessage);
  }
  return payload.data as T;
}

/**
 * Calls a Creator Interface endpoint that returns its JSON directly
 * (e.g. `/creator/assistant/get_assistants`, `/creator/libraries`).
 * @returns The whole response body.
 */
export async function lambJson<T>(url: string, options: LambRequestOptions): Promise<T> {
  const { response, payload } = await send<T & { detail?: unknown }>(url, options);
  if (!response.ok) {
    const detail = typeof payload.detail === 'string' ? payload.detail : undefined;
    throw new Error(detail || options.errorMessage);
  }
  return payload as T;
}

/** Sends the request and parses its body, mapping transport failures and expired tokens. */
async function send<T extends object>(
  url: string,
  { method = 'GET', body, token }: LambRequestOptions,
): Promise<{ response: Response; payload: Partial<T> }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  let response: Response;
  try {
    response = await fetch(url, { method, body, headers });
  } catch {
    throw new NetworkError();
  }

  if (token && response.status === 401) throw new SessionExpiredError();

  return { response, payload: await readJson<T>(response) };
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
