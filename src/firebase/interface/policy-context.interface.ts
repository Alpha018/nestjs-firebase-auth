import { DecodedIdToken } from 'firebase-admin/auth';

/** Context passed to a policy handler when evaluating a request. */
export interface PolicyContext {
  user: DecodedIdToken;
  request: unknown;
  claims: unknown;
}
