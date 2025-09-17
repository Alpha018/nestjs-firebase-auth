import { signInWithCustomToken, getAuth } from 'firebase/auth';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ExtractJwt } from 'passport-jwt';
import * as firebase from 'firebase/app';
import * as request from 'supertest';

import { UsersController, Roles } from './controller/user.controller';
import { mockClaims } from './__mock__/custom-claims';
import { FirebaseAdminModule } from '../src';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let server: any;
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
      controllers: [UsersController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    server = app.getHttpServer();
    configService = app.get(ConfigService);

    const firebaseConfig = JSON.parse(
      Buffer.from(configService.get<string>('FIREBASE_CLIENT_BASE64'), 'base64').toString('utf-8'),
    );

    if (!firebase.getApps().length) {
      firebase.initializeApp(firebaseConfig);
    }
  });

  const loginAndGetIdToken = async (uid: string) => {
    const customTokenResponse = await request(app.getHttpServer())
      .post('/users/login')
      .send({ uid });
    const { accessToken } = customTokenResponse.body;
    const auth = getAuth();
    const userCredential = await signInWithCustomToken(auth, accessToken);
    return userCredential.user.getIdToken();
  };

  it('/users/me (GET - Forbidden)', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(403);
  });

  it('/users/login (POST - Ok)', async () => {
    const uid = configService.get(keyUserEnv);
    const result = await request(app.getHttpServer()).post('/users/login').send({ uid });

    const responseBody = result.body;
    expect(result.status).toBe(200);
    expect(responseBody).toHaveProperty('accessToken');
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    expect(responseBody.accessToken).toMatch(jwtRegex);
  });

  it('/users/me (POST - Login - Me)', async () => {
    const uid = configService.get(keyUserEnv);
    const idToken = await loginAndGetIdToken(uid);

    const result = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${idToken}`)
      .expect(200);

    const responseBody = result.body;
    expect(responseBody).toHaveProperty('aud');
    expect(responseBody).toHaveProperty('user_id');
    expect(typeof responseBody.user_id).toBe('string');
    expect(responseBody).toHaveProperty('email');
    expect(typeof responseBody.email).toBe('string');
    expect(responseBody).toHaveProperty('firebase');
    expect(responseBody.firebase).toHaveProperty('sign_in_provider');
  });

  it('/users/set-role-claims (POST - Set claims)', async () => {
    const uid = configService.get(keyUserEnv);
    const response = await request(app.getHttpServer())
      .post('/users/set-role-claims')
      .send({ claim: Roles.ADMIN, uid })
      .expect(200);

    const responseBody = response.body;
    expect(responseBody).toHaveProperty('status');
  });

  it('/users/set-claims (POST - Set claims)', async () => {
    const uid = configService.get(keyUserEnv);
    const response = await request(app.getHttpServer())
      .post('/users/set-claims')
      .send({ claim: mockClaims, uid })
      .expect(200);

    const responseBody = response.body;
    expect(responseBody).toHaveProperty('status');
  });

  it('/users/get-role-claims (GET - Get claims)', async () => {
    const uid = configService.get(keyUserEnv);
    const idToken = await loginAndGetIdToken(uid);

    const response = await request(app.getHttpServer())
      .get('/users/get-role-claims')
      .set('Authorization', `Bearer ${idToken}`)
      .expect(200);

    const responseBody = response.body;
    expect(responseBody).toHaveProperty([Roles.ADMIN]);
  });

  it('/users/get-claims (GET - Get claims)', async () => {
    const uid = configService.get(keyUserEnv);
    const idToken = await loginAndGetIdToken(uid);

    const response = await request(app.getHttpServer())
      .get('/users/get-claims')
      .set('Authorization', `Bearer ${idToken}`)
      .expect(200);

    expect(response.body).toEqual(expect.objectContaining(mockClaims));
  });

  it('/users/get-role-claims (GET - Get claims - 401)', async () => {
    const uid = configService.get(keyUserEnv);
    const idToken = await loginAndGetIdToken(uid);

    await request(app.getHttpServer())
      .post('/users/set-role-claims')
      .send({ claim: Roles.USER, uid })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/users/get-role-claims')
      .set('Authorization', `Bearer ${idToken}`)
      .expect(403);

    const responseBody = response.body;
    expect(responseBody).toHaveProperty('statusCode', 403);
  });

  afterAll(async () => {
    const uid = configService.get(keyUserEnv);
    await request(app.getHttpServer()).post('/users/set-role-claims').send({ claim: null, uid });
    await app.close();
    server.close();
  });
});
