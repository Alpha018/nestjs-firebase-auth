# Migrations

## Upgrading from v1.x to v1.9.0

### Accessing `firebaseApp`

In versions prior to 1.9.0, accessing the initialized `admin.app.App` instance directly from `FirebaseProvider` was not officially documented or type-safe.

In **v1.9.0**, `FirebaseProvider` exposes the `app` getter, allowing direct access to the app instance for integrating with other Firebase services (Firestore, Storage, Messaging, etc.).

```typescript
// Old (workaround)
// const app = (provider as any).app;

// New (v1.9.0+)
import { getFirestore } from 'firebase-admin/firestore';

const app = provider.app;
const firestore = getFirestore(app);
```

### Deprecation of Direct `FirebaseGuard` Usage

Using `FirebaseGuard` directly with `@UseGuards` is now **deprecated** in favor of the specialized decorators, which provide a cleaner and more consistent API.

**Deprecated:**

```typescript
@UseGuards(FirebaseGuard)
@Get('r')
route() {}
```

**Recommended:**

```typescript
@Auth()
@Get('r')
route() {}
```

## Upgrading from v1.x to v2.0.0

`v2.0.0` upgrades the bundled Firebase Admin SDK from **v13** to **v14**. This library's own API is unchanged — every decorator, guard, `FirebaseAdminModule` and `FirebaseProvider` keeps the same signature. The breaking changes come from the SDK and propagate to your application.

| Change | Impact | Action required |
|---|---|---|
| Minimum Node.js is now `22.12` | Application fails to start on Node.js 20 or older | Upgrade your runtime |
| `auth` namespace removed from the package root | Type-only, fails at compile time | Change one import |

### 1. Node.js 22.12 or newer is required

Firebase Admin SDK v14 [drops support for Node.js 18 and 20](https://github.com/firebase/firebase-admin-node/releases) and declares `engines: node >=22`. It also depends on `jose`, an ESM-only package, reached through `jwks-rsa`. Loading an ESM package from CommonJS needs `require(ESM)`, which is only stable from Node.js **22.12** — so `22.12` is the real floor, slightly higher than the SDK's own `>=22`.

| Runtime | Result |
|---|---|
| Node.js 20 and older | ❌ Throws `ERR_REQUIRE_ESM` when the library is imported |
| Node.js 22.0 – 22.11 | ❌ Throws `ERR_REQUIRE_ESM` |
| Node.js 22.12 and newer | ✅ Fully supported |

Node.js 20 reached [end-of-life on 2026-04-30](https://github.com/nodejs/Release), so this drops a runtime that no longer receives security updates.

### 2. The `auth` namespace import was removed

Firebase Admin SDK v14 removes the deprecated legacy namespaces. `auth.DecodedIdToken` is no longer exported from the package root, so any parameter you typed with it stops compiling with:

```
TS2305: Module '"firebase-admin"' has no exported member 'auth'
```

Import the type from the public `firebase-admin/auth` entry point instead:

```typescript
// Before
import { auth } from 'firebase-admin';

@FirebaseUser() user: auth.DecodedIdToken

// After (v2.0.0+)
import { DecodedIdToken } from 'firebase-admin/auth';

@FirebaseUser() user: DecodedIdToken
```

The same applies to deep imports such as `firebase-admin/lib/auth`, which v14 now blocks through its `exports` map. These were never public API; use `firebase-admin/auth`.

### 3. Testing with Jest

If your test suite imports this library without mocking `firebase-admin`, Jest needs help with `jose`. Jest resolves modules through its own registry rather than Node's, so it does not benefit from the native `require(ESM)` support your runtime already has.

On Node.js 22, transpile `jose` to CommonJS:

```json
{
  "transform": {
    "^.+\\.(t|j)s$": ["ts-jest", { "tsconfig": { "allowJs": true } }]
  },
  "transformIgnorePatterns": ["node_modules/(?!jose/)"]
}
```

Tests that reach Firebase for real — rather than mocking it — additionally require **Node.js 24.9+**. Those load `google-auth-library`, which performs a dynamic `import()` that Jest only resolves with `--experimental-vm-modules`; that same flag makes Jest treat `jose` as ESM again, which it can only require from CommonJS on 24.9+. The two requirements cannot both be satisfied on Node.js 22.

Mocking `firebase-admin/auth` in your unit tests avoids all of the above.

## Upgrading from v2.x to v3.0.0

`FirebaseGuard` used to collapse every authentication and authorization failure into a boolean, which Nest always turned into a **403 Forbidden**. That conflated "you didn't send valid credentials" (401) with "you're authenticated but not allowed" (403), and silently swallowed the underlying Firebase Admin SDK error.

`v3.0.0` replaces the boolean result with typed exceptions:

| Failure | Before | After |
|---|---|---|
| No token in the request | `403` | `401` (`TokenNotFoundException`) |
| Invalid / malformed token | `403` | `401` (`TokenInvalidException`) |
| Expired token | `403` | `401` (`TokenExpiredException`) |
| Revoked token (`checkRevoked: true`) | `403` | `401` (`TokenRevokedException`) |
| Missing required role | `403` | `403` (`InsufficientRoleException`, unchanged status) |

Every exception extends `FirebaseAuthException` and responds with a stable `code` field (see `FirebaseAuthErrorCode`) alongside the message, so you can branch on the failure reason instead of parsing text:

```typescript
{ "statusCode": 401, "code": "FIREBASE_AUTH_TOKEN_EXPIRED", "message": "The authentication token has expired" }
```

### Action required

If your application or its tests assert a `403` for requests with a missing or invalid token, update those assertions to `401`. Requests that are authenticated but lack the required role keep returning `403`, unchanged.

```typescript
// Before
await request(app).get('/protected').expect(403);

// After (v3.0.0+) — no/invalid token now reports 401
await request(app).get('/protected').expect(401);
```

If you need to react to a specific failure, catch the typed exception (or check `error.code` against `FirebaseAuthErrorCode`) instead of relying on the status code alone.

### Removal of deprecated guards and decorators

`v3.0.0` also removes the APIs that were marked `@deprecated` in earlier versions:

| Removed | Replacement |
|---|---|
| `RolesGuard(...)` | `@Roles(...)` |
| `FirebaseUserClaims()` | `@FirebaseRolesClaims()` |
| `FirebaseGuard` (public export) | `@Auth()` or `@Roles(...)` |

`FirebaseGuard` still exists internally — it's what `@Auth()` and `@Roles()` apply under the hood — but it's no longer exported from the package, so `import { FirebaseGuard } from '@alpha018/nestjs-firebase-auth'` stops compiling. Replace any direct `@UseGuards(FirebaseGuard)` usage with `@Auth()`, and `@UseGuards(FirebaseGuard) @RolesGuard(...)` with `@Roles(...)`.

```typescript
// Before
@UseGuards(FirebaseGuard)
@RolesGuard(Roles.ADMIN)
@Get('r')
route() {}

// After (v3.0.0+)
@Roles(Roles.ADMIN)
@Get('r')
route() {}
```

### Deprecated options

`v3.0.0` also deprecates one config option, still supported but scheduled for removal in a future major version:

| Deprecated | Replacement |
|---|---|
| `auth.config.useLocalRoles` | `auth.config.useLocalDecode` |

`useLocalRoles` keeps working exactly as before. `useLocalDecode` does the same thing (local vs remote resolution of roles and claims), under a name that isn't tied to "roles" now that it also governs `ClaimsGuard`. If both are set, `useLocalDecode` wins.
