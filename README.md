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
    - [Import Module](#import-module)
    - [Auth Guard without Role](#auth-guard-without-role)
    - [Auth Guard with Role](#auth-guard-with-role)
- [Resources](#resources)
- [Stay in touch](#stay-in-touch)
- [License](#license)

## Installation
```bash
$ npm i @alpha018/nestjs-firebase-auth
```

## Usage

### Import Module
Import the module in your main module
```ts
import { FirebaseAuthGuard } from '@alpha018/nestjs-firebase-auth';

@Module({
  imports: [
    ...
      FirebaseAdminModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          // you only need to choose one of the two options base64 or firebase option
          base64: configService.get('FIREBASE_SERVICE_ACCOUNT_BASE64'), // service account json string in base 64
          options: '',
          auth: {
            config: {
              extractor: ExtractJwt.fromAuthHeaderAsBearerToken(), // you can choose your extractor from passport lib
              checkRevoked: true, // if you need to check revoked token from firebase set this param in true
              validateRole: true, // if you need to validate role from firebase set this param in true
            },
          },
        }),
        inject: [TicketServiceConfig],
      }),
    ...
  ],
})
```

### Auth Guard without Role
Use the Auth Guard in your controller without role based
```ts
export class AppController {
  constructor(
    private readonly firebaseService: FirebaseProvider,
  ) {}

  @UseGuards(FirebaseGuard) // this line protect your endpoint and depending of the parameter validateRole, validate the role of the user
  @Get()
  mainFunction() {
    return 'hola mundo';
  }
}
```

### Auth Guard with Role

Use the Auth Guard in your controller with role based
```ts
enum Roles {
  ADMIN,
  USER,
}

@Controller('')
export class AppController {
  constructor(
    private readonly firebaseService: FirebaseProvider,
  ) {}

  @RolesGuard(Roles.ADMIN, Roles.USER) // this line protect your endpoint reading the custom claims of firebase user
  @UseGuards(FirebaseGuard) // this line protect your endpoint and depending of the parameter validateRole, validate the role of the user
  @Get()
  mainFunction() {
    return 'Hello World';
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
