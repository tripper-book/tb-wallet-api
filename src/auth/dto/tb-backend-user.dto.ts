/**
 * User summary returned by tb-backend-service (or mock) for token verification.
 */
export interface TbBackendUser {
  id: string;
  email?: string | null;
  name?: string | null;
}
