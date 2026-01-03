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

## Future Breaking Changes

In the next major version (`v2.0.0`), the `FirebaseGuard` class export may be removed or made internal. Please migrate to using `@Auth()` and `@Roles()` decorators.
