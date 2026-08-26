import { TestingModule, Test } from '@nestjs/testing';
import { Controller, Get } from '@nestjs/common';

import { FirebaseAdminModule } from './firebase-admin.module';
import { FirebaseGuard } from './guard/firebase.guard';
import { Auth } from './decorator/auth.decorator';

jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn().mockReturnValue({ name: 'mockApp' }),
  getApps: jest.fn().mockReturnValue([]),
  getApp: jest.fn(),
  cert: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn().mockReturnValue({}),
}));

@Controller()
class DummyController {
  @Auth()
  @Get()
  ping() {
    return 'pong';
  }
}

describe('FirebaseAdminModule', () => {
  describe('forRoot', () => {
    it('wires FirebaseGuard so routes protected by @Auth() can resolve', async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [FirebaseAdminModule.forRoot({ options: { projectId: 'test' } })],
        controllers: [DummyController],
      }).compile();

      expect(moduleRef.get(FirebaseGuard)).toBeInstanceOf(FirebaseGuard);
    });
  });

  describe('forRootAsync', () => {
    it('wires FirebaseGuard so routes protected by @Auth() can resolve', async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [
          FirebaseAdminModule.forRootAsync({
            useFactory: () => ({ options: { projectId: 'test' } }),
          }),
        ],
        controllers: [DummyController],
      }).compile();

      expect(moduleRef.get(FirebaseGuard)).toBeInstanceOf(FirebaseGuard);
    });
  });
});
