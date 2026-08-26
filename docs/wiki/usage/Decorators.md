# Decorators

## `@Auth()`

Protects a route or controller using the `FirebaseGuard`. It ensures that the request contains a valid Firebase ID token in the `Authorization: Bearer <token>` header.

**Usage:**

```typescript
@Auth()
@Get('secure')
getSecureData() { ... }
```

## `@FirebaseUser()`

Extracts the decoded ID token from the request object. This provides access to user information like `uid`, `email`, `email_verified`, and any custom claims.

> [!IMPORTANT]
> This decorator requires the route to be protected by `@Auth()` (or `FirebaseGuard`) to function. Without the guard, the user object is not attached to the request.

**Usage:**

```typescript
@Injectable()
@Controller('user')
export class UserController {
  @Get('me')
  getMe(@FirebaseUser() user: DecodedIdToken) {
    return {
      uid: user.uid,
      email: user.email,
    };
  }
}
```

## `@Roles(...roles: string[])`

Specifies the roles required to access a route. The user must have **at least one** of the specified roles to be granted access.

**Requirements:**

- `validateRole: true` must be set in `FirebaseAdminModule` configuration.
- The user must have a custom claim (default key: `'roles'`) containing an array of roles.

**Usage:**

```typescript
@Auth()
@Roles('ADMIN', 'SUPERUSER')
@Get('admin-panel')
getAdminPanel() { ... }
```

## `@FirebaseRolesClaims()`

Extracts the roles claim array from the authenticated user's token or custom claims. This is useful if you want to inspect the user's roles within your controller logic.

**Usage:**

```typescript
@Get('my-roles')
getMyRoles(@FirebaseRolesClaims() roles: string[]) {
  return roles;
}
```

## `@Policies(...policies: PolicyReference[])`

Specifies the policies (ABAC) required to access a route. Applies `FirebaseGuard` and `PoliciesGuard`, and every listed policy must resolve for the request to proceed. Works exactly like `@UseGuards()`: each argument is either a `PolicyHandler` class (resolved through Nest's DI container) or an instance built with `new`. See [[Authorization-Policies|Authorization-Policies]] for how to define one.

**Usage:**

```typescript
@Policies(ResourceOwnerPolicyHandler)
@Get(':ownerId')
getResource(@Param('ownerId') ownerId: string) { ... }
```

> [!NOTE]
> `@Auth({ policies: [...] })` is an equivalent way to set the same policies; use whichever reads better at the call site, but not both on the same route.
