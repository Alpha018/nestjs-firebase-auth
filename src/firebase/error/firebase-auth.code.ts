/** Ordered error codes for authentication and authorization failures raised by `FirebaseGuard`. */
export enum FirebaseAuthErrorCode {
  INSUFFICIENT_ROLE = 'FIREBASE_AUTH_INSUFFICIENT_ROLE',
  TOKEN_NOT_FOUND = 'FIREBASE_AUTH_TOKEN_NOT_FOUND',
  TOKEN_INVALID = 'FIREBASE_AUTH_TOKEN_INVALID',
  TOKEN_EXPIRED = 'FIREBASE_AUTH_TOKEN_EXPIRED',
  TOKEN_REVOKED = 'FIREBASE_AUTH_TOKEN_REVOKED',
}
