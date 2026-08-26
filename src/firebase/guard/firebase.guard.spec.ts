import { TestingModule, Test } from '@nestjs/testing';
import { DecodedIdToken } from 'firebase-admin/auth';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  InsufficientRoleException,
  TokenNotFoundException,
  TokenExpiredException,
  TokenRevokedException,
  TokenInvalidException,
} from '../error/firebase-auth.exception';
import { FIREBASE_TOKEN_USER_METADATA, FIREBASE_ADMIN_CONFIG } from '../constant/firebase.constant';
import { FirebaseProvider } from '../provider/firebase.provider';
import { FirebaseGuard } from './firebase.guard';

class FirebaseProviderMock {
  auth = {
    verifyIdToken: jest.fn(),
  };

  getClaimsRoleBase = jest.fn();
}

class ReflectorMock {
  getAllAndOverride = jest.fn();
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
        { useClass: FirebaseProviderMock, provide: FirebaseProvider },
        { provide: FIREBASE_ADMIN_CONFIG, useValue: {} },
        { useClass: ReflectorMock, provide: Reflector },
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
        getClass: jest.fn(),
      } as any;
    });

    it('should skip verification if user is already attached (optimization)', async () => {
      request.headers.authorization = bearerToken;
      // Mock existing attached user
      request.metadata = {
        [FIREBASE_TOKEN_USER_METADATA]: { user: { uid: 'existing_user' } },
      };

      // Should NOT call verifyIdToken
      const result = await guard.canActivate(context);
      expect(firebaseProvider.auth.verifyIdToken).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw TokenNotFoundException if no token is found', async () => {
      // Ensure headers object exists but authorization is missing/undefined
      request.headers = {};
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(TokenNotFoundException);
    });

    it('should throw TokenExpiredException when the SDK reports an expired token', async () => {
      request.headers.authorization = 'Bearer expired_token';
      firebaseProvider.auth.verifyIdToken.mockRejectedValue({ code: 'auth/id-token-expired' });

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(TokenExpiredException);
    });

    it('should throw TokenRevokedException when the SDK reports a revoked token', async () => {
      request.headers.authorization = 'Bearer revoked_token';
      firebaseProvider.auth.verifyIdToken.mockRejectedValue({ code: 'auth/id-token-revoked' });

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(TokenRevokedException);
    });

    it('should throw TokenInvalidException for unrecognized verification failures', async () => {
      request.headers.authorization = 'Bearer invalid_token';
      firebaseProvider.auth.verifyIdToken.mockRejectedValue(new Error('Token verification failed'));

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(TokenInvalidException);
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
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should attach claims even when the route has no @Roles(), as long as validateRole is on', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({ uid: 'user_id' } as DecodedIdToken);
      (guard as any).config.auth = { config: { validateRole: true } };
      reflector.getAllAndOverride.mockReturnValue(undefined);
      firebaseProvider.getClaimsRoleBase.mockResolvedValue(['user']);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(firebaseProvider.getClaimsRoleBase).toHaveBeenCalledWith(
        expect.objectContaining({ uid: 'user_id' }),
        false,
      );
      expect(request.metadata.FIREBASE_CLAIMS_METADATA.claims).toEqual(['user']);
    });

    it('should not fetch or attach claims when validateRole is off, even on the re-entry path', async () => {
      request.headers.authorization = bearerToken;
      request.metadata = {
        [FIREBASE_TOKEN_USER_METADATA]: { user: { uid: 'user_id' } },
      };
      (guard as any).config.auth = { config: { validateRole: false } };
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(firebaseProvider.getClaimsRoleBase).not.toHaveBeenCalled();
    });

    it('should return true if user has required role', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({ uid: 'user_id' } as DecodedIdToken);
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      firebaseProvider.getClaimsRoleBase.mockResolvedValue(['user', 'admin']);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw InsufficientRoleException if user does not have required role', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({ uid: 'user_id' } as DecodedIdToken);
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      firebaseProvider.getClaimsRoleBase.mockResolvedValue(['user']);

      (guard as any).config.auth = { config: { validateRole: true } };

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(InsufficientRoleException);
    });

    it('should throw InsufficientRoleException if user has no roles (roles undefined) but roles are required', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({ uid: 'user_id' } as DecodedIdToken);
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      firebaseProvider.getClaimsRoleBase.mockResolvedValue(undefined); // Simulate no roles

      (guard as any).config.auth = { config: { validateRole: true } };

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(InsufficientRoleException);
    });

    it('should apply @Roles() metadata defined at the controller class level', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({ uid: 'user_id' } as DecodedIdToken);
      firebaseProvider.getClaimsRoleBase.mockResolvedValue(['admin']);
      (guard as any).config.auth = { config: { validateRole: true } };

      reflector.getAllAndOverride.mockReturnValue(['admin']);
      await guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(expect.any(String), [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should resolve roles locally when useLocalDecode is true', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({ uid: 'user_id' } as DecodedIdToken);
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      firebaseProvider.getClaimsRoleBase.mockResolvedValue(['admin']);
      (guard as any).config.auth = { config: { useLocalDecode: true, validateRole: true } };

      await guard.canActivate(context);

      expect(firebaseProvider.getClaimsRoleBase).toHaveBeenCalledWith(expect.anything(), true);
    });

    it('should let useLocalDecode take precedence over useLocalRoles when both are set', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({ uid: 'user_id' } as DecodedIdToken);
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      firebaseProvider.getClaimsRoleBase.mockResolvedValue(['admin']);
      (guard as any).config.auth = {
        config: { useLocalDecode: false, useLocalRoles: true, validateRole: true },
      };

      await guard.canActivate(context);

      expect(firebaseProvider.getClaimsRoleBase).toHaveBeenCalledWith(expect.anything(), false);
    });

    it('should return true when the required roles list is empty (e.g. bare @Roles())', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({ uid: 'user_id' } as DecodedIdToken);
      reflector.getAllAndOverride.mockReturnValue([]);
      firebaseProvider.getClaimsRoleBase.mockResolvedValue(['admin']);
      (guard as any).config.auth = { config: { validateRole: true } };

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should return true when the required roles list is empty and validateRole is off', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({ uid: 'user_id' } as DecodedIdToken);
      reflector.getAllAndOverride.mockReturnValue([]);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should return true if reflector returns null instead of undefined for roles', async () => {
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({} as DecodedIdToken);
      reflector.getAllAndOverride.mockReturnValue(null);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should not crash when the re-entry path finds attached metadata with a null user', async () => {
      request.headers.authorization = bearerToken;
      request.metadata = {
        [FIREBASE_TOKEN_USER_METADATA]: { user: null },
      };
      (guard as any).config.auth = { config: { validateRole: false } };
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(firebaseProvider.auth.verifyIdToken).not.toHaveBeenCalled();
    });

    it('should not crash when constructed with a null injected config', () => {
      expect(
        () => new FirebaseGuard(firebaseProvider as any, null as any, reflector as any),
      ).not.toThrow();
    });

    it('should not crash on canActivate when the injected config is null', async () => {
      const guardWithNullConfig = new FirebaseGuard(
        firebaseProvider as any,
        null as any,
        reflector as any,
      );
      request.headers.authorization = bearerToken;
      firebaseProvider.auth.verifyIdToken.mockResolvedValue({} as DecodedIdToken);

      await expect(guardWithNullConfig.canActivate(context)).resolves.toBe(true);
    });

    it('should use custom extractor if provided', async () => {
      const customExtractor = jest.fn().mockReturnValue('custom_token');
      const guardWithExtractor = new FirebaseGuard(
        firebaseProvider as any,
        { auth: { config: { extractor: customExtractor } } } as any,
        reflector as any,
      );

      await guardWithExtractor.canActivate(context);

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
