import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseProvider } from '../provider/firebase.provider';
import { FIREBASE_ADMIN_CONFIG } from '../constant/firebase.constant';
import { Reflector } from '@nestjs/core';
import { DecodedIdToken } from 'firebase-admin/lib/auth';
import { FirebaseGuard } from './firebase.guard';

class FirebaseProviderMock {
  auth = {
    verifyIdToken: jest.fn(),
  };

  getClaimsRoleBase = jest.fn();
}

class ReflectorMock {
  get = jest.fn();
}

describe('FirebaseGuard', () => {
  let guard: FirebaseGuard;
  let firebaseProvider: FirebaseProviderMock;
  let reflector: ReflectorMock;
  const bearerToken = 'Bearer valid_token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseGuard,
        { provide: FirebaseProvider, useClass: FirebaseProviderMock },
        { provide: FIREBASE_ADMIN_CONFIG, useValue: {} },
        { provide: Reflector, useClass: ReflectorMock },
      ],
    }).compile();

    guard = module.get<FirebaseGuard>(FirebaseGuard);
    firebaseProvider = module.get<FirebaseProviderMock>(FirebaseProvider);
    reflector = module.get<ReflectorMock>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let context: ExecutionContext;
    let request: any;

    beforeEach(() => {
      request = {
        headers: {},
      };
      context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
        getHandler: jest.fn(),
      } as any;
    });

    it('should return false if no token is found', async () => {
      const result = await guard.canActivate(context);
      expect(result).toBe(false);
    });

    it('should return false if token verification fails', async () => {
      request.headers.authorization = 'Bearer invalid_token';
      firebaseProvider.auth.verifyIdToken.mockRejectedValue(new Error('Token verification failed'));

      const result = await guard.canActivate(context);
      expect(result).toBe(false);
    });

    it('should return true if validateRole is false', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({} as DecodedIdToken);
      (guard as any).config.auth = { config: { validateRole: false } };

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should return true if no roles are defined', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({} as DecodedIdToken);
      reflector.get.mockReturnValue(undefined);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should return true if user has required role', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({ uid: 'user_id' } as DecodedIdToken);
      reflector.get.mockReturnValue(['admin']);
      firebaseProvider.getClaimsRoleBase.mockResolvedValue(['user', 'admin']);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should return false if user does not have required role', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({ uid: 'user_id' } as DecodedIdToken);
      reflector.get.mockReturnValue(['admin']);
      firebaseProvider.getClaimsRoleBase.mockResolvedValue(['user']);

      (guard as any).config.auth = { config: { validateRole: true } };

      const result = await guard.canActivate(context);
      expect(result).toBe(false);
    });

    it('should use custom extractor if provided', async () => {
      const customExtractor = jest.fn().mockReturnValue('custom_token');
      (guard as any).config.auth = { config: { extractor: customExtractor } };

      await guard.canActivate(context);

      expect(customExtractor).toHaveBeenCalledWith(request);
    });
  });

  describe('extractTokenFromRequest', () => {
    it('should extract token from Authorization header', () => {
      const request = {
        headers: {
          authorization: 'Bearer test_token',
        },
      } as any;

      const token = guard['extractTokenFromRequest'](request);
      expect(token).toBe('test_token');
    });

    it('should return null if no Authorization header', () => {
      const request = {
        headers: {},
      } as any;

      const token = guard['extractTokenFromRequest'](request);
      expect(token).toBeNull();
    });
  });
});
