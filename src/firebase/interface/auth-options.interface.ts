import { PolicyReference } from './policy.interface';

export interface AuthOptions {
  /** Policies (ABAC) to evaluate for this route, in addition to authentication. */
  policies?: PolicyReference[];
  /** Fine-grained claims required for this route — all listed claims must be present. */
  claims?: unknown[];
  /** Roles (RBAC) required for this route — satisfied if the user has any one of them. */
  roles?: unknown[];
}
