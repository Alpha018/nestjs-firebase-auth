# Basic Usage

## Protecting Routes

To protect a route and ensure the user is authenticated with Firebase, use the `@Auth()` decorator. This decorator combines `UseGuards(FirebaseGuard)` and ensures a valid ID token is present.

```typescript
import { Controller, Get } from '@nestjs/common';
import { Auth, FirebaseUser } from '@alpha018/nestjs-firebase-auth';
import { DecodedIdToken } from 'firebase-admin/lib/auth';

// Apply @Auth() to the entire controller
@Auth()
@Controller('users')
export class UsersController {

  @Get('me')
  getMe(@FirebaseUser() user: DecodedIdToken) {
    return {
      uid: user.uid,
      email: user.email,
    };
  }

  // This endpoint is also protected
  @Get('fcm-token')
  getFcmToken(@FirebaseUser() user: DecodedIdToken) {
     // ...
  }
}
```

You can also apply it to specific endpoints:

```typescript
@Controller('public')
export class PublicController {

  @Get('hello')
  getHello() {
    return 'Hello World';
  }

  // Only this endpoint is protected
  @Auth()
  @Get('private')
  getPrivate() {
    return 'Secret Data';
  }
}
```

## Accessing User Information

Use the `@FirebaseUser()` parameter decorator to access the decoded ID token of the authenticated user.

> [!IMPORTANT]
> To use `@FirebaseUser()`, the route **must** be protected by `@Auth()` (or `FirebaseGuard`). The guard is responsible for verifying the token and attaching the user object to the request. Without the guard, `@FirebaseUser()` will return undefined.

```typescript
@Get('profile')
getProfile(@FirebaseUser() user: DecodedIdToken) {
  console.log('User UID:', user.uid);
  return user;
}
```

## Role-Based Access Control

If you have enabled role validation in your configuration (`validateRole: true`), you can restrict access to specific roles using the `@Roles()` decorator.

> [!NOTE]
> Like `@FirebaseUser()`, the `@Roles()` decorator requires the route to be protected by `@Auth()` to function correctly, as the guard performs the role verification.

```typescript
import { Controller, Get } from '@nestjs/common';
import { Auth, Roles } from '@alpha018/nestjs-firebase-auth';

@Controller('admin')
export class AdminController {

  @Auth()
  @Roles('ADMIN')
  @Get('dashboard')
  getDashboard() {
    return 'Welcome Admin!';
  }

  @Auth()
  @Roles('ADMIN', 'EDITOR')
  @Get('content')
  getContent() {
    return 'Content accessible by Admins and Editors';
  }
}
```
