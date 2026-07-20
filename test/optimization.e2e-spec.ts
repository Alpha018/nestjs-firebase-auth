import { signInWithCustomToken, getAuth } from 'firebase/auth';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ExtractJwt } from 'passport-jwt';
import * as firebase from 'firebase/app';
import request from 'supertest';

import { OptimizationController, OptimizationRoles } from './controller/optimization.controller';
import { FirebaseAdminModule, FirebaseProvider } from '../src';
import { UsersController } from './controller/user.controller';

describe('Optimization (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let server: any;
  let firebaseProvider: FirebaseProvider;
  const keyUserEnv = 'FIREBASE_TEST_USER';

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        FirebaseAdminModule.forRootAsync({
          useFactory: (configService: ConfigService) => ({
            auth: {
              config: {
                extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
                rolesClaimKey: 'test-role-key',
                validateRole: true,
              },
            },
            base64: configService.get('FIREBASE_SERVICE_ACCOUNT_BASE64'),
          }),
          imports: [ConfigModule],
          inject: [ConfigService],
        }),
      ],
      controllers: [OptimizationController, UsersController], // UsersController needed for login helper
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    server = app.getHttpServer();
    configService = app.get(ConfigService);
    firebaseProvider = app.get(FirebaseProvider);

    const firebaseConfig = JSON.parse(
      Buffer.from(configService.get<string>('FIREBASE_CLIENT_BASE64') || '', 'base64').toString('utf-8'),
    );

    if (!firebase.getApps().length) {
      firebase.initializeApp(firebaseConfig);
    }
  });

  const loginAndGetIdToken = async (uid: string) => {
    // We use UsersController from the other test file just to help us log in conveniently
    // Alternatively, we could duplicate the login logic but better to reuse if we registered the controller
    const customTokenResponse = await request(app.getHttpServer())
      .post('/users/login')
      .send({ uid });
    const { accessToken } = customTokenResponse.body;
    const auth = getAuth();
    const userCredential = await signInWithCustomToken(auth, accessToken);
    return userCredential.user.getIdToken();
  };

  it('should call verifyIdToken only ONCE when @Auth (Class) and @Roles (Method) correspond to a single request', async () => {
    const uid = configService.get(keyUserEnv);

    // Setup: Set user as ADMIN so roles check passes
    // We need to use UsersController endpoint to set claims because OptimizationController doesn't have it
    // Wait, UsersController uses a different Roles enum. OptimizationController uses OptimizationRoles.
    // They are just enums (numbers). If we match the number, it should work.
    // OptimizationRoles.ADMIN = 0.

    // Let's verify we can check/set claims correctly.
    // We can use the provider directly since we have it injected in `firebaseProvider`.

    // 1. Set Role
    await firebaseProvider.setClaimsRoleBase(uid, [OptimizationRoles.ADMIN]);

    // 2. Login
    const idToken = await loginAndGetIdToken(uid);

    // 3. Spy on verifyIdToken
    const verifySpy = jest.spyOn(firebaseProvider.auth, 'verifyIdToken');

    // 4. Request
    await request(app.getHttpServer())
      .get('/optimization/double-guard')
      .set('Authorization', `Bearer ${idToken}`)
      .expect(200);

    // 5. Assertions
    // It should be called exactly once. The second guard execution should skip it.
    expect(verifySpy).toHaveBeenCalledTimes(1);

    verifySpy.mockRestore();
  });

  afterAll(async () => {
    await app.close();
    server.close();
  });
});
