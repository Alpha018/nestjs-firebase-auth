# Claim-Based Authorization (Fine-Grained)

`@Roles()` answers "what type of user is this?", and it's satisfied by any one of the listed roles. Some rules need finer control than a category: a route that requires several distinct permissions at once, not just membership in a broad group. That's what claims are for.

> [!NOTE]
> Claims (fine-grained) sit alongside roles (RBAC) and policies (ABAC) as the third authorization mechanism, not a replacement for either. They commonly layer: a role narrows the category, claims require specific actions within it, a policy adds a contextual check on top. See [Combining roles, claims, and policies](#combining-roles-claims-and-policies).

## Prerequisites

`@RequireClaims()` and `@Auth({ claims })` always apply `FirebaseGuard` together with `ClaimsGuard`, so `FirebaseAdminModule.forRoot()` (or `forRootAsync()`) has to be configured for either decorator to work. `FirebaseGuard` is also what fills in `context.user` before `ClaimsGuard` runs.

## `.every()`, not `.some()`

This is the one fact that distinguishes claims from roles: `@Roles('ADMIN', 'EDITOR')` passes if the user has *any* of the two, `@RequireClaims('users:read', 'users:write')` passes only if the user has *both*.

```typescript
enum UsersClaim {
  READ = 'users:read',
  WRITE = 'users:write',
}

@RequireClaims(UsersClaim.READ, UsersClaim.WRITE)
@Patch(':id')
updateUser() { ... }
```

A user whose `permissions` claim is `['users:read']` gets rejected here with `403 InsufficientClaimsException`, even though they hold one of the two claims. A user with `['users:read', 'users:write']` (or more) passes. Requiring a single claim is just the one-element case of the same rule: `@RequireClaims(UsersClaim.WRITE)`.

## How claims are stored

Fine-grained claims live in the same Firebase custom claims object as roles, but under their own key, so the two never collide:

| Mechanism | Storage key | Default | Config option |
|---|---|---|---|
| Roles (RBAC) | `rolesClaimKey` | `'roles'` | `auth.config.rolesClaimKey` |
| Claims (fine-grained) | `claimsClaimKey` | `'permissions'` | `auth.config.claimsClaimKey` |

Set them with `setClaimsPermissionBase<T>(uid, claims)`, which preserves every other custom claim (including roles) and only overwrites the `claimsClaimKey` entry:

```typescript
await this.firebaseProvider.setClaimsPermissionBase<UsersClaim>('some-firebase-uid', [
  UsersClaim.READ,
  UsersClaim.WRITE,
]);
```

Resulting custom claims:

```json
{ "roles": ["EDITOR"], "permissions": ["users:read", "users:write"] }
```

## Claims from multiple domains

`@RequireClaims<T>` is generic over `T`. The guard only checks string membership in the stored array, so it doesn't care which enum a value came from: claims from several domains can coexist as plain strings in the same claims array.

```typescript
enum ReportsClaim {
  EXPORT = 'reports:export',
}

enum InvoicesClaim {
  ISSUE = 'invoices:issue',
}

enum UsersClaim {
  READ = 'users:read',
  WRITE = 'users:write',
}

await this.firebaseProvider.setClaimsPermissionBase<string>('some-firebase-uid', [
  UsersClaim.READ,
  InvoicesClaim.ISSUE,
  ReportsClaim.EXPORT,
]);
```

A route can then require claims across those domains in one call:

```typescript
@RequireClaims(UsersClaim.WRITE, InvoicesClaim.ISSUE)
@Post('reconcile')
reconcileAccounts() { ... }
```

> [!IMPORTANT]
> Firebase caps the combined size of all custom claims at ~1000 bytes once serialized, shared across `rolesClaimKey`, `claimsClaimKey`, and anything else stored in the same object. An app with many fine-grained claims across several domains should use short claim codes (`'u:w'` rather than `'users:write-access-permission'`) to stay under that budget.

## Applying claims to a route

`@RequireClaims()` works like `@UseGuards()`: it takes the claims to require directly, no class or instance to construct.

```typescript
// Standalone
@RequireClaims(UsersClaim.READ, UsersClaim.WRITE)
@Get(':id')
getUser(@Param('id') id: string) { ... }

// Composed with authentication
@Auth({ claims: [UsersClaim.READ, UsersClaim.WRITE] })
@Get(':id')
getUser(@Param('id') id: string) { ... }
```

> [!IMPORTANT]
> Both forms already include `FirebaseGuard`. Don't put `@RequireClaims()` and `@Auth({ claims })` on the same route: each one applies `ClaimsGuard` on its own, so combining them registers the guard twice for no benefit.

## Local vs remote claim resolution

`ClaimsGuard` reads the same `useLocalDecode` config option `FirebaseGuard` reads for roles:

- **Remote (default, `useLocalDecode: false`)**: fetches the latest user record from Firebase (`getUser()`) to read `customClaims[claimsClaimKey]`. Always current, at the cost of one extra network call per request on `@RequireClaims()` routes.
- **Local (`useLocalDecode: true`)**: reads the claims embedded in the already-decoded ID token instead. No extra call, but claims stay stale until the client refreshes its token.

```typescript
auth: {
  config: {
    useLocalDecode: true,
    claimsClaimKey: 'permissions', // default
  }
}
```

> [!NOTE]
> There's a single `useLocalDecode` switch, it isn't split per mechanism: turning it on affects both role and claim resolution together. `useLocalRoles` is the deprecated equivalent it supersedes, still supported for backward compatibility; if both are set, `useLocalDecode` wins.

## Combining roles, claims, and policies

Roles, claims, and policies compose on the same route through `@Auth({ roles, claims, policies })`, each layer narrowing what the previous one allowed. `@Auth()` applies `FirebaseGuard` once and adds `ClaimsGuard`/`PoliciesGuard` only for the options actually passed, so there's no duplicate token verification between the three.

See [[Complex Examples|Complex-Examples]] for worked examples combining all three.

## Handling rejections

A failed claim check raises `InsufficientClaimsException` (`403`), with the same `code`/`message` shape as the rest of the library's auth errors:

```json
{ "statusCode": 403, "code": "FIREBASE_AUTH_INSUFFICIENT_CLAIMS", "message": "The authenticated user does not have the required claims" }
```

Catch `InsufficientClaimsException` or check `error.code` against `FirebaseAuthErrorCode.INSUFFICIENT_CLAIMS` to react to it specifically, same as the other typed exceptions documented in [[Migrations|Migrations]].

## Testing a claim-gated route

`ClaimsGuard` itself is already covered by the library's own unit tests. What's worth testing in a consuming app is the handler behind a `@RequireClaims()` route, the same way you'd test any other guarded endpoint: by asserting on the metadata or by exercising the controller with a request-scoped `Reflector` mock.

```typescript
describe('UsersController', () => {
  it('requires both READ and WRITE claims on updateUser', () => {
    const metadata = Reflect.getMetadata(FIREBASE_CLAIMS_DECORATOR, UsersController.prototype.updateUser);

    expect(metadata).toEqual([UsersClaim.READ, UsersClaim.WRITE]);
  });
});
```

For an integration-style test, mock `FirebaseProvider.getClaimsPermissionBase` to return a fixed claims array and assert the controller method runs, or that `ClaimsGuard` throws `InsufficientClaimsException` when a claim is missing:

```typescript
describe('ClaimsGuard integration', () => {
  it('rejects when the user is missing one of two required claims', async () => {
    const firebaseProvider = { getClaimsPermissionBase: jest.fn().mockResolvedValue([UsersClaim.READ]) };
    const guard = new ClaimsGuard(reflector, firebaseProvider as any, config);

    await expect(guard.canActivate(context)).rejects.toThrow(InsufficientClaimsException);
  });
});
```
