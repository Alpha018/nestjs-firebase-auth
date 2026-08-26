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
   * Indicates whether to use locally decoded values (roles and claims) from the JWT token,
   * instead of fetching them from Firebase on every request.
   *
   * Supersedes `useLocalRoles`, which is deprecated. If both are set, this one wins.
   *
   * @default false
   */
  useLocalDecode?: boolean;

  /**
   * Indicates whether to use roles embedded in locally decoded JWT tokens.
   *
   * - If `true`, roles will be read directly from the decoded token payload.
   * - If `false`, roles will be fetched from Firebase custom claims instead.
   *
   * @deprecated Use `useLocalDecode` instead. Scheduled for removal in a future major version.
   * @default false
   */
  useLocalRoles?: boolean;

  /**
   * The name of the key within the Firebase custom claims that stores the user's
   * fine-grained claims. Customize this if `'permissions'` already means something else
   * in your custom claims object.
   *
   * @default 'permissions' (defined by `FIREBASE_APP_CLAIMS_DEFAULT_DECORATOR`)
   */
  claimsClaimKey?: string;

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

  /**
   * The name of the key within the Firebase custom claims that stores the user's roles.
   *
   * This allows you to customize the property name for roles in the custom claims object.
   * For example, if you set this to `'permissions'`, the library will look for a `permissions`
   * array in the custom claims.
   *
   * All role-related operations performed by `FirebaseProvider` (such as getting, setting, or preserving roles) will use this key.
   *
   * @example
   * // If rolesClaimKey is 'user_roles', the custom claims might look like:
   * // { "user_roles": ["ADMIN", "EDITOR"] }
   *
   * @default 'roles' (defined by `FIREBASE_APP_ROLES_DEFAULT_DECORATOR`)
   */
  rolesClaimKey?: string;
}
