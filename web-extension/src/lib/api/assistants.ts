/**
 * LAMB Creator Interface assistant endpoints.
 * Mirrors frontend/svelte-app/src/lib/services/assistantService.js.
 */
import { lambJson } from './http';
import type { LambAssistantPage } from '../types';

/** Page size used by the side panel; the endpoint accepts up to 100. */
export const ASSISTANTS_PAGE_SIZE = 20;

/** Fetches one page of the assistants owned by the token's owner. */
export function fetchAssistants(
  serverUrl: string,
  token: string,
  offset = 0,
  limit = ASSISTANTS_PAGE_SIZE,
): Promise<LambAssistantPage> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return lambJson<LambAssistantPage>(`${serverUrl}/creator/assistant/get_assistants?${params}`, {
    token,
    errorMessage: 'Could not load your assistants.',
  });
}

/** Strips the `<user id>_` prefix LAMB stores in assistant names. */
export function assistantDisplayName(name: string): string {
  return name.replace(/^\d+_/, '');
}
