/** Token used to provide async module options */
export const FIREBASE_ADMIN_MODULE_OPTIONS = 'FIREBASE_ADMIN_MODULE_OPTIONS';
/** Token used for injecting the Firebase provider */
export const FIREBASE_ADMIN_INJECT = 'FIREBASE_ADMIN_INJECT';
/** Token used to inject Firebase configuration */
export const FIREBASE_ADMIN_CONFIG = 'FIREBASE_ADMIN_CONFIG';
/** Token that identifies the guard provider */
export const FIREBASE_ADMIN_AUTH_STRATEGY = 'FIREBASE_ADMIN_AUTH_STRATEGY';

/** Key used to store the authenticated user in the request metadata */
export const FIREBASE_TOKEN_USER_METADATA = 'FIREBASE_USER_METADATA';
/** Key used to store resolved claims in the request metadata */
export const FIREBASE_CLAIMS_USER_METADATA = 'FIREBASE_CLAIMS_METADATA';
/** Metadata key for role based authorization decorator */
export const FIREBASE_APP_ROLES_DECORATOR = 'ROLES';
/** Metadata key for policy based (ABAC) authorization decorator */
export const FIREBASE_POLICIES_DECORATOR = 'POLICIES';

export const FIREBASE_APP_ROLES_DEFAULT_DECORATOR = 'roles';
export const FIREBASE_AUTH_OPTIONS = 'FIREBASE_AUTH_OPTIONS';
