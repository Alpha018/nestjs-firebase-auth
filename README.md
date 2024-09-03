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

## Installation
```bash
$ npm i @alpha018/nestjs-firebase-auth firebase-admin
```

## Usage

### Import The Module
To use Firebase authentication in your application, import the module into your main module.
```ts
import { FirebaseAuthGuard } from '@alpha018/nestjs-firebase-auth';

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
            },
          },
        }),
        inject: [TicketServiceConfig],
      }),
    ...
  ],
})
```
## Parameter Options

| Parameter                      | Type         | Required | Description                                                                                         |
|--------------------------------|--------------|----------|-----------------------------------------------------------------------------------------------------|
| `base64`                       | `string`     | Yes*     | Base64 encoded service account JSON string. Required if `options` is not provided.                  |
| `options`                      | `object`     | Yes*     | Firebase Admin SDK configuration options. Required if `base64` is not provided.                     |
| `auth.config.extractor`        | `function`   | Optional | A custom extractor function from the Passport library to extract the token from the request.        |
| `auth.config.checkRevoked`     | `boolean`    | Optional | Set to `true` to check if the Firebase token has been revoked. Defaults to `false`.                 |
| `auth.config.validateRole`     | `boolean`    | Optional | Set to `true` to validate user roles using Firebase custom claims. Defaults to `false`.             |


### Auth Guard Without Role Validation
To protect an endpoint without validating user roles, use the Auth Guard to ensure the Firebase user's token is valid.
```ts
import { FirebaseGuard, FirebaseProvider } from '@alpha018/nestjs-firebase-auth';

export class AppController {
  constructor(
    private readonly firebaseProvider: FirebaseProvider,
  ) {}

  @UseGuards(FirebaseGuard) // This line protects your endpoint. If `validateRole` is enabled, it also validates the user's role.
  @Get()
  mainFunction() {
    return 'Hello World';
  }
}
```

### Auth Guard With Role Validation

To enforce role-based access control, you need to set custom claims in Firebase. Here's how you can set custom claims:
```ts
import { FirebaseProvider } from '@alpha018/nestjs-firebase-auth';

enum Roles {
  ADMIN,
  USER,
}

@Controller('')
export class AppController implements OnModuleInit {
  constructor(
    private readonly firebaseProvider: FirebaseProvider,
  ) {}

  @Get()
  async setClaims() {
    await this.firebaseProvider.setClaimsRoleBase<Roles>(
      'FirebaseUID',
      [Roles.ADMIN, ...]
    );
    return { status: 'ok' }
  }
}
```

Then, use the Auth Guard with role validation to check if a user has the necessary permissions to access an endpoint:
```ts
import { FirebaseGuard, FirebaseProvider, RolesGuard } from '@alpha018/nestjs-firebase-auth';
enum Roles {
  ADMIN,
  USER,
}

@Controller('')
export class AppController {
  constructor(
    private readonly firebaseProvider: FirebaseProvider,
  ) {}

  @RolesGuard(Roles.ADMIN, Roles.USER) // This line checks the custom claims of the Firebase user to protect the endpoint
  @UseGuards(FirebaseGuard) // This line protects your endpoint and, if `validateRole` is enabled, validates the user's role
  @Get()
  mainFunction() {
    return 'Hello World';
  }
}
```

### Additional Information

To retrieve user claims, use the following example:
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
  async mainFunction() {
    const claims = await this.firebaseProvider.getClaimsRoleBase<Roles>(
      'FirebaseUID',
    );
    return claims; // This returns an array of the user's claims
  }
}
```

To retrieve Decode ID Token and Claims, use the following example:
```ts
import {
  FirebaseGuard,
  FirebaseProvider, FirebaseUser, FirebaseUserClaims,
  RolesGuard,
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

  @RolesGuard(Roles.ADMIN, Roles.USER)
  @UseGuards(FirebaseGuard)
  @Get()
  async mainFunction(
    @FirebaseUser() user: auth.DecodedIdToken,
    @FirebaseUserClaims() claims: Roles[],
  ) {
    return {
      user,
      claims
    };
  }
}
```
## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).


## Stay in touch

- Author - [Tomás Alegre](https://github.com/Alpha018)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
