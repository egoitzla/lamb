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
