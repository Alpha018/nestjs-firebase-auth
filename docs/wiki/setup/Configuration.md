# Configuration

To use `nestjs-firebase-auth`, you need to import the `FirebaseAdminModule` into your root `AppModule`.

## Basic Configuration

You can configure the module synchronously using `forRoot`. This is suitable for simple setups or testing.

```typescript
import { Module } from '@nestjs/common';
import { FirebaseAdminModule } from '@alpha018/nestjs-firebase-auth';

@Module({
  imports: [
    FirebaseAdminModule.forRoot({
      base64: 'YOUR_BASE64_ENCODED_SERVICE_ACCOUNT_JSON',
    }),
  ],
})
export class AppModule {}
```

## Asynchronous Configuration

For production applications, it's recommended to use `ConfigService` to load secrets securely. Use `forRootAsync`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirebaseAdminModule } from '@alpha018/nestjs-firebase-auth';
import { ExtractJwt } from 'passport-jwt';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseAdminModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // You can use a base64 encoded string of the service account JSON
        base64: configService.get<string>('FIREBASE_SERVICE_ACCOUNT_BASE64'),
        auth: {
           config: {
             checkRevoked: true,
             validateRole: true,
             rolesClaimKey: 'roles', // Default is 'roles'
             extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
           }
        }
      }),
    }),
  ],
})
export class AppModule {}
```

## Options Reference

| Option | Type | Description |
| :--- | :--- | :--- |
| `base64` | `string` | Base64 encoded Service Account JSON. Exclusive with `options`. |
| `options` | `AppOptions` | Firebase Admin `AppOptions` (use this if not using `base64`). |
| `auth.config` | `object` | Authentication configuration settings. |

### Auth Config (`auth.config`)

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `checkRevoked` | `boolean` | `false` | Whether to check if the ID token has been revoked by the user (requires extra network call). |
| `validateRole` | `boolean` | `false` | If true, enables role validation logic via `@Roles` decorator. |
| `rolesClaimKey` | `string` | `'roles'` | The key in the Custom Claims object that holds the user's role(s). |
| `useLocalRoles` | `boolean` | `false` | If true, the guard reads roles directly from the decoded token payload instead of calling `getUser()` to fetch the user record's custom claims. The default (`false`) adds one Firebase round-trip per request on `@Roles()` routes; `true` avoids it but serves roles that stay stale until the client's token is refreshed. |
| `extractor` | `JwtFromRequestFunction` | `Bearer Token` | Custom JWT extractor function (from `passport-jwt`). |
