/** Shared types. This file has no runtime code. */

export interface LambUser {
  name: string;
  email: string;
  user_id: number;
  role: string;
  user_type: 'creator' | 'end_user';
  organization_role: string | null;
  launch_url: string;
}

export interface LambSession {
  /** Normalized LAMB base URL, e.g. `http://localhost:9099` */
  serverUrl: string;
  /** Bearer token returned by `/creator/login` */
  token: string;
  user: LambUser;
}

/** An assistant as listed by `/creator/assistant/get_assistants` (only the fields the extension uses). */
export interface LambAssistant {
  id: number;
  /** Stored with a `<user id>_` prefix; see `assistantDisplayName`. */
  name: string;
  description: string | null;
  /** Published assistants can be added to Moodle as LTI activities. */
  published: boolean;
  published_at: number | null;
  /** Unix timestamps in seconds */
  created_at?: number | null;
  updated_at?: number | null;
}

export interface LambAssistantPage {
  assistants: LambAssistant[];
  total_count: number;
}
