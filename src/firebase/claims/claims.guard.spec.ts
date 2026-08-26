import { TestingModule, Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { FIREBASE_TOKEN_USER_METADATA, FIREBASE_ADMIN_CONFIG } from '../constant/firebase.constant';
import { InsufficientClaimsException } from '../error/firebase-auth.exception';
import { FirebaseProvider } from '../provider/firebase.provider';
import { ClaimsGuard } from './claims.guard';

class FirebaseProviderMock {
  getClaimsPermissionBase = jest.fn();
}

class ReflectorMock {
  getAllAndOverride = jest.fn();
}

describe('ClaimsGuard', () => {
  let guard: ClaimsGuard;
  let firebaseProvider: FirebaseProviderMock;
  let reflector: ReflectorMock;
  let context: ExecutionContext;
  let request: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsGuard,
        { useClass: ReflectorMock, provide: Reflector },
        { useClass: FirebaseProviderMock, provide: FirebaseProvider },
        { provide: FIREBASE_ADMIN_CONFIG, useValue: {} },
      ],
    }).compile();

    guard = module.get(ClaimsGuard);
    reflector = module.get(Reflector);
    firebaseProvider = module.get(FirebaseProvider);

    request = {
      metadata: {
        [FIREBASE_TOKEN_USER_METADATA]: { user: { uid: 'user-1' } },
      },
    };
    context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  });

  it('should return true if no claims are required', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(firebaseProvider.getClaimsPermissionBase).not.toHaveBeenCalled();
  });

  it('should return true and never fetch claims when the required list is empty', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(firebaseProvider.getClaimsPermissionBase).not.toHaveBeenCalled();
  });

  it('should return true when the user has every required claim', async () => {
    reflector.getAllAndOverride.mockReturnValue(['users:read', 'users:write']);
    firebaseProvider.getClaimsPermissionBase.mockResolvedValue([
      'users:read',
      'users:write',
      'users:delete',
    ]);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(firebaseProvider.getClaimsPermissionBase).toHaveBeenCalledWith({ uid: 'user-1' }, false);
  });

  it('should throw InsufficientClaimsException when a required claim is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue(['users:read', 'users:write']);
    firebaseProvider.getClaimsPermissionBase.mockResolvedValue(['users:read']);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(InsufficientClaimsException);
  });

  it('should throw InsufficientClaimsException when the user has no claims', async () => {
    reflector.getAllAndOverride.mockReturnValue(['users:read']);
    firebaseProvider.getClaimsPermissionBase.mockResolvedValue(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(InsufficientClaimsException);
  });

  it('should return true if reflector returns null instead of undefined', async () => {
    reflector.getAllAndOverride.mockReturnValue(null);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(firebaseProvider.getClaimsPermissionBase).not.toHaveBeenCalled();
  });

  it('should throw InsufficientClaimsException instead of crashing when metadata is entirely missing', async () => {
    request.metadata = undefined;
    reflector.getAllAndOverride.mockReturnValue(['users:read']);
    firebaseProvider.getClaimsPermissionBase.mockResolvedValue(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(InsufficientClaimsException);
    expect(firebaseProvider.getClaimsPermissionBase).toHaveBeenCalledWith(undefined, false);
  });

  it('should throw InsufficientClaimsException instead of crashing when the attached user is null', async () => {
    request.metadata[FIREBASE_TOKEN_USER_METADATA].user = null;
    reflector.getAllAndOverride.mockReturnValue(['users:read']);
    firebaseProvider.getClaimsPermissionBase.mockResolvedValue(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(InsufficientClaimsException);
    expect(firebaseProvider.getClaimsPermissionBase).toHaveBeenCalledWith(null, false);
  });

  it('should not crash when the injected config is null', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsGuard,
        { useClass: ReflectorMock, provide: Reflector },
        { useClass: FirebaseProviderMock, provide: FirebaseProvider },
        { provide: FIREBASE_ADMIN_CONFIG, useValue: null },
      ],
    }).compile();

    const localGuard = module.get<ClaimsGuard>(ClaimsGuard);
    const localReflector = module.get<ReflectorMock>(Reflector);
    const localFirebaseProvider = module.get<FirebaseProviderMock>(FirebaseProvider);

    localReflector.getAllAndOverride.mockReturnValue(['users:read']);
    localFirebaseProvider.getClaimsPermissionBase.mockResolvedValue(['users:read']);

    await expect(localGuard.canActivate(context)).resolves.toBe(true);
    expect(localFirebaseProvider.getClaimsPermissionBase).toHaveBeenCalledWith(
      { uid: 'user-1' },
      false,
    );
  });

  it('should read useLocalRoles from the injected config', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsGuard,
        { useClass: ReflectorMock, provide: Reflector },
        { useClass: FirebaseProviderMock, provide: FirebaseProvider },
        { useValue: { auth: { config: { useLocalRoles: true } } }, provide: FIREBASE_ADMIN_CONFIG },
      ],
    }).compile();

    const localGuard = module.get<ClaimsGuard>(ClaimsGuard);
    const localReflector = module.get<ReflectorMock>(Reflector);
    const localFirebaseProvider = module.get<FirebaseProviderMock>(FirebaseProvider);

    localReflector.getAllAndOverride.mockReturnValue(['users:read']);
    localFirebaseProvider.getClaimsPermissionBase.mockResolvedValue(['users:read']);

    await expect(localGuard.canActivate(context)).resolves.toBe(true);
    expect(localFirebaseProvider.getClaimsPermissionBase).toHaveBeenCalledWith(
      { uid: 'user-1' },
      true,
    );
  });

  it('should read useLocalDecode from the injected config', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsGuard,
        { useClass: ReflectorMock, provide: Reflector },
        { useClass: FirebaseProviderMock, provide: FirebaseProvider },
        {
          useValue: { auth: { config: { useLocalDecode: true } } },
          provide: FIREBASE_ADMIN_CONFIG,
        },
      ],
    }).compile();

    const localGuard = module.get<ClaimsGuard>(ClaimsGuard);
    const localReflector = module.get<ReflectorMock>(Reflector);
    const localFirebaseProvider = module.get<FirebaseProviderMock>(FirebaseProvider);

    localReflector.getAllAndOverride.mockReturnValue(['users:read']);
    localFirebaseProvider.getClaimsPermissionBase.mockResolvedValue(['users:read']);

    await expect(localGuard.canActivate(context)).resolves.toBe(true);
    expect(localFirebaseProvider.getClaimsPermissionBase).toHaveBeenCalledWith(
      { uid: 'user-1' },
      true,
    );
  });

  it('should let useLocalDecode take precedence over useLocalRoles when both are set', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsGuard,
        { useClass: ReflectorMock, provide: Reflector },
        { useClass: FirebaseProviderMock, provide: FirebaseProvider },
        {
          useValue: { auth: { config: { useLocalDecode: false, useLocalRoles: true } } },
          provide: FIREBASE_ADMIN_CONFIG,
        },
      ],
    }).compile();

    const localGuard = module.get<ClaimsGuard>(ClaimsGuard);
    const localReflector = module.get<ReflectorMock>(Reflector);
    const localFirebaseProvider = module.get<FirebaseProviderMock>(FirebaseProvider);

    localReflector.getAllAndOverride.mockReturnValue(['users:read']);
    localFirebaseProvider.getClaimsPermissionBase.mockResolvedValue(['users:read']);

    await expect(localGuard.canActivate(context)).resolves.toBe(true);
    expect(localFirebaseProvider.getClaimsPermissionBase).toHaveBeenCalledWith(
      { uid: 'user-1' },
      false,
    );
  });
});
