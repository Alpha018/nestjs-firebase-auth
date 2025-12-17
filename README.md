# NestJS Firebase Auth

<div align="center">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo_text.svg" width="150" alt="Nest Logo" />
  </a>
</div>

<h3 align="center">NestJS Passport Strategy for Firebase Auth using Firebase Admin SDK, which includes the Firebase SDK library for use.</h3>

<div align="center">
  <a href="https://nestjs.com" target="_blank">
    <img src="https://img.shields.io/badge/built%20with-NestJs-red.svg" alt="Built with NestJS">
  </a>
  <a href="https://github.com/Alpha018/nestjs-firebase-auth/actions">
    <img src="https://github.com/Alpha018/nestjs-firebase-auth/actions/workflows/test.yml/badge.svg" alt="Test Status">
  </a>
  <a href="https://github.com/Alpha018/nestjs-firebase-auth">
    <img src="https://img.shields.io/github/stars/Alpha018/nestjs-firebase-auth?style=social" alt="GitHub stars">
  </a>
</div>

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
  - [Import the Module](#import-the-module)
  - [Parameter Options](#parameter-options)
  - [Auth Guard Without Role Validation](#auth-guard-without-role-validation)
  - [Auth Guard With Role Validation](#auth-guard-with-role-validation)
  - [Additional Information](#additional-information)
- [Resources](#resources)
- [Stay in touch](#stay-in-touch)
- [License](#license)

> **⚠️ Important:** Starting from this version, the minimum required Node.js version is **20**, due to the Firebase Admin SDK v12 upgrade.

## Installation
```bash
$ npm i @alpha018/nestjs-firebase-auth firebase-admin
```

## Usage

### Import The Module
To use Firebase authentication in your application, import the module into your main module.
```ts
import { FirebaseAdminModule } from '@alpha018/nestjs-firebase-auth';

@Module({
  imports: [
    ...
      FirebaseAdminModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          // SELECT ONLY ONE: BASE64 OR OPTIONS (Firebase Options)!
          base64: configService.get('FIREBASE_SERVICE_ACCOUNT_BASE64'), // Base64 encoded service account JSON string
          options: {}, // Use this if not using base64
          auth: {
            config: {
              extractor: ExtractJwt.fromAuthHeaderAsBearerToken(), // Choose your extractor from the Passport library
              checkRevoked: true, // Set to true if you want to check for revoked Firebase tokens
              validateRole: true, // Set to true if you want to validate user roles
              useLocalRoles: true, // Set to true if you want to validate user roles locally without firebase call
              rolesClaimKey: 'user_roles' // Set the name of the key within the Firebase custom claims that stores user roles
            },
          },
        }),
        inject: [ConfigService],
      }),
    ...
  ],
})
```
## Parameter Options

| Parameter                   | Type       | Required | Description                                                                                                                                                                                                               |
|-----------------------------|------------|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `base64`                    | `string`   | Yes*     | Base64 encoded service account JSON string. Required if `options` is not provided.                                                                                                                                        |
| `options`                   | `object`   | Yes*     | Firebase Admin SDK configuration options. Required if `base64` is not provided.                                                                                                                                           |
| `auth.config.extractor`     | `function` | Optional | A custom extractor function from the Passport library to extract the token from the request.                                                                                                                              |
| `auth.config.checkRevoked`  | `boolean`  | Optional | Set to `true` to check if the Firebase token has been revoked. Defaults to `false`.                                                                                                                                       |
| `auth.config.validateRole`  | `boolean`  | Optional | Set to `true` to validate user roles using Firebase custom claims. Defaults to `false`.                                                                                                                                   |
| `auth.config.useLocalRoles` | `boolean`  | Optional | Set to `true` to validate user roles using local custom claims inside the JWT token. Defaults to `false`. **Note:** If you update the claims, previously issued tokens may still contain outdated roles and remain valid. |
| `auth.config.rolesClaimKey` | `string`   | Optional | The name of the key within the Firebase custom claims that stores user roles. Defaults to `'roles'`. This allows you to customize the property name for roles in your custom claims object.                               |


### Auth Guard Without Role Validation

> **⚠️ Deprecation Warning:** Direct usage of `UseGuards(FirebaseGuard)` is deprecated. Please use the `@Auth` decorator instead.

To protect an endpoint without validating user roles, use the Auth Guard to ensure the Firebase user's token is valid.
```ts
import { Auth, FirebaseProvider } from '@alpha018/nestjs-firebase-auth';

export class AppController {
  constructor(
    private readonly firebaseProvider: FirebaseProvider,
  ) {}

  @Auth() // This line protects your endpoint with Firebase Auth
  @Get()
  mainFunction() {
    return 'Hello World';
  }
}
```

### Auth Guard With Role Validation

To enforce role-based access control, you need to set role-based custom claims in Firebase. Here's how you can set roles for a user using `setClaimsRoleBase`:
```ts
import { FirebaseProvider } from '@alpha018/nestjs-firebase-auth';

enum Roles {
  ADMIN,
  USER,
}

@Controller('')
export class AppController {
  constructor(
    private readonly firebaseProvider: FirebaseProvider,
  ) {}

  @Get()
  async setUserRoles() {
    await this.firebaseProvider.setClaimsRoleBase<Roles>(
      'some-firebase-uid', // The UID of the user you want to set roles for
      [Roles.ADMIN]
    );
    return { status: 'ok' }
  }
}
```

Then, use the Auth Guard with role validation to check if a user has the necessary permissions to access an endpoint:
```ts
import { Roles } from '@alpha018/nestjs-firebase-auth';
enum Roles {
  ADMIN,
  USER,
}

@Controller('')
export class AppController {
  constructor(
    private readonly firebaseProvider: FirebaseProvider,
  ) {}

  @Roles(Roles.ADMIN, Roles.USER) // This line checks the custom claims of the Firebase user AND ensures the user is authenticated (implicitly applies FirebaseGuard)
  @Get()
  mainFunction() {
    return 'Hello World';
  }
}
```

### Controller-Level Authentication with Method-Level Authorization

You can apply authentication at the controller level using `@Auth()` and then define specific roles for individual routes using `@Roles()`. The library is optimized to prevent redundant token verification in this scenario.

```ts
import { Auth, Roles } from '@alpha018/nestjs-firebase-auth';

enum AppRoles {
  ADMIN,
  USER,
}

@Auth() // Protects all routes in this controller (ensures valid token)
@Controller('users')
export class UsersController {
  
  @Get('profile')
  getProfile() {
    // Accessible by any authenticated user
    return { status: 'ok' };
  }

  @Roles(AppRoles.ADMIN) // Adds specific authorization requirement
  @Get('admin-dashboard')
  getAdminDashboard() {
    // Accessible ONLY by authenticated users with ADMIN role
    return { status: 'secure' };
  }
}
```

### Additional Information

To retrieve the Decoded ID Token and role claims within a protected route, use the `@FirebaseUser` and `@FirebaseRolesClaims` parameter decorators.
```ts
import {
  FirebaseProvider,
  FirebaseUser,
  FirebaseRolesClaims,
  Roles,
} from '@alpha018/nestjs-firebase-auth';

import { auth } from 'firebase-admin';

enum Roles {
  ADMIN,
  USER,
}

@Controller('')
export class AppController {
  constructor(
    private readonly firebaseProvider: FirebaseProvider,
  ) {}

  @Roles(Roles.ADMIN, Roles.USER)
  @Get()
  async mainFunction(
    @FirebaseUser() user: auth.DecodedIdToken,
    @FirebaseRolesClaims() claims: Roles[],
  ) {
    return {
      user,
      claims
    };
  }
}
```

#### Difference Between `@FirebaseUser` and `@FirebaseUserClaims`

> **Note:** Starting from version `>=1.7.x`, these two decorators are explicitly separated to avoid confusion (see [issue #11](https://github.com/Alpha018/nestjs-firebase-auth/issues/11)):

- `@FirebaseUser()` → Returns the **full decoded token** (`auth.DecodedIdToken`).
- `@FirebaseUserClaims()` → Returns only the **custom role claims** (roles/permissions) defined for the user.

This separation ensures that developers can access both the raw Firebase user object and the role/claims information independently.

## Migration Guide (v1.9.x)

To improve semantic clarity and developer experience, direct usage of guards has been deprecated in favor of more descriptive decorators.

### 1. Replace `RolesGuard` with `@Roles`

**Deprecated:**
```ts
@UseGuards(FirebaseGuard) // or alone if global
@RolesGuard(Roles.ADMIN)
```

**New Way:**
```ts
@Roles(Roles.ADMIN)
```
*Note: `@Roles` automatically applies the authentication guard.*

---

### 2. Replace `UseGuards(FirebaseGuard)` with `@Auth`

**Deprecated:**
```ts
@UseGuards(FirebaseGuard)
```

**New Way:**
```ts
@Auth()
```

---

### Why migrate?
- **Better readability**: `@Auth` vs `@UseGuards(FirebaseGuard)` clearly states intent.
- **Optimized Performance**: The new decorators use an optimized guard that prevents redundant token verification checks when composing controllers and methods.
- **Future Proofing**: Direct class exports for guards will be removed in the next major version.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).


## Stay in touch

- Author - [Tomás Alegre](https://github.com/Alpha018)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
