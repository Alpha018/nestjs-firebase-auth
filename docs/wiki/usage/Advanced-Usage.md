# Advanced Usage

## Custom Claims Management

The library provides methods to easily manage custom claims, separating role claims from other data.

```typescript
import { Injectable } from '@nestjs/common';
import { FirebaseProvider } from '@alpha018/nestjs-firebase-auth';

@Injectable()
export class UserService {
  constructor(private readonly firebaseProvider: FirebaseProvider) {}

  async setAdminRole(uid: string) {
    // Sets 'roles' claim to ['ADMIN'], preserving other existing custom claims
    await this.firebaseProvider.setClaimsRoleBase(uid, ['ADMIN']);
  }

  async addSubscriptionData(uid: string) {
    // Sets custom claims (e.g. premium status), preserving the existing role claims
    await this.firebaseProvider.setClaimsBase(uid, { premium: true, validUntil: '2025-12-31' });
  }

  async setUserPermissions(uid: string) {
    // Sets the 'permissions' claim, preserving roles and any other existing custom claims
    await this.firebaseProvider.setClaimsPermissionBase(uid, ['users:read', 'users:write']);
  }
}
```

See [[Claims (Fine-Grained)|Authorization-Claims]] for how these fine-grained claims are checked against a route.

## Accessing the Firebase App Instance

If you need to access the underlying `admin.app.App` instance (e.g., to use Firestore, Storage, or Messaging), you can access it via the `FirebaseProvider`.

This is useful for integrating other Firebase services without initializing the app multiple times.

```typescript
import { Injectable } from '@nestjs/common';
import { FirebaseProvider } from '@alpha018/nestjs-firebase-auth';
import { getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class FirestoreService {
  constructor(private readonly firebaseProvider: FirebaseProvider) {}

  async getUserDocument(uid: string) {
    // Pass the initialized app instance to getFirestore
    const firestore = getFirestore(this.firebaseProvider.app);
    const doc = await firestore.collection('users').doc(uid).get();
    return doc.data();
  }

  async createUserLog(uid: string, message: string) {
    const firestore = getFirestore(this.firebaseProvider.app);
    await firestore.collection('logs').add({
      uid,
      message,
      timestamp: new Date(),
    });
  }
}
```

## Token Decoding Strategy

You can choose how roles are validated:

- **Remote (Default)**: Fetches the latest user record from Firebase to check claims. This ensures the most up-to-date roles but adds a network call.
- **Local (`useLocalDecode: true`)**: Checks the roles present in the decoded ID token. This is faster but requires the token to be refreshed on the client side after roles are changed.

> [!IMPORTANT]
> The remote strategy runs an extra `getUser()` call to Firebase on **every request** that hits a `@Roles()` route, on top of the token verification the guard already performs. The role claims are already embedded in the verified ID token, so `useLocalDecode: true` serves them without that round-trip. Prefer local validation on latency-sensitive routes and keep the remote default only when you need role changes to take effect before the client's token expires (up to ~1 hour).

> [!NOTE]
> Regardless of the strategy, the `@Auth()` decorator is required to trigger the validation logic.

The same `useLocalDecode` option, and the same trade-off, applies to `ClaimsGuard` for `@RequireClaims()` routes: it reads fine-grained claims from the decoded token locally, or fetches the user record remotely, following the same switch used for roles.

`useLocalRoles` is the older name for this same switch. It's deprecated (scheduled for removal in a future major version) but still fully supported for backward compatibility; if both options are set, `useLocalDecode` wins.

Configure this in the module options:

```typescript
auth: {
  config: {
    useLocalDecode: true, // Enable local validation
    // ...
  }
}
```
