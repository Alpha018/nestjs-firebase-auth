import {
  FirebaseAuthException,
  TokenExpiredException,
  TokenInvalidException,
  TokenRevokedException,
} from './firebase-auth.exception';

/**
 * Maps a raw error thrown by the Firebase Admin SDK's `verifyIdToken` (identified by its
 * `error.code`, e.g. `auth/id-token-expired`) to the matching typed `FirebaseAuthException`.
 * Unrecognized codes fall back to `TokenInvalidException`.
 */
export function mapFirebaseAuthError(error: unknown): FirebaseAuthException {
  const code = (error as { code?: string })?.code;

  switch (code) {
    case 'auth/id-token-expired':
      return new TokenExpiredException();
    case 'auth/id-token-revoked':
      return new TokenRevokedException();
    default:
      return new TokenInvalidException();
  }
}
