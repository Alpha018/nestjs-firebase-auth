import { JwtFromRequestFunction } from 'passport-jwt';

/**
 * Interface representing configuration options for the Firebase authentication strategy.
 * These options control how JWT tokens are extracted, validated, and how user roles are handled.
 */
export interface FirebaseAuthStrategyOptions {
  /**
   * A custom function to extract the JWT token from the incoming request.
   *
   * By default, tokens are usually extracted from the `Authorization` header as a Bearer token,
   * but this allows customizing extraction logic (e.g., from cookies or query parameters).
   *
   * @see https://github.com/mikenicholson/passport-jwt#extracting-the-jwt-from-the-request
   */
  extractor?: JwtFromRequestFunction;

  /**
   * Indicates whether to use roles embedded in locally decoded JWT tokens.
   *
   * - If `true`, roles will be read directly from the decoded token payload.
   * - If `false`, roles will be fetched from Firebase custom claims instead.
   *
   * @default false
   */
  useLocalRoles?: boolean;

  /**
   * Indicates whether to check if the provided Firebase ID token has been revoked.
   *
   * - If `true`, the token is verified against Firebase's revocation mechanism.
   * - If `false`, revocation status will not be checked.
   *
   * @default false
   */
  checkRevoked?: boolean;

  /**
   * Indicates whether to enforce role-based validation during authentication.
   *
   * - If `true`, authenticated users must satisfy role requirements defined in guards/decorators.
   * - If `false`, role validation will be skipped.
   *
   * @default false
   */
  validateRole?: boolean;
}
