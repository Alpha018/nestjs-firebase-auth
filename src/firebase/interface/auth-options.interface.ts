import { PolicyReference } from './policy.interface';

export interface AuthOptions {
  /** Policies (ABAC) to evaluate for this route, in addition to authentication. */
  policies?: PolicyReference[];
}
