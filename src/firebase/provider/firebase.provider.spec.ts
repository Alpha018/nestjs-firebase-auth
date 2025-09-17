import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { DecodedIdToken } from 'firebase-admin/lib/auth';
import { TestingModule, Test } from '@nestjs/testing';
import { getAuth } from 'firebase-admin/auth';
import * as fa from 'firebase-admin';

import { FirebaseConstructorInterface } from '../interface/firebase-constructor.interface';
import { userDecode } from '../__mocks__/firebase-user-mock';
import { FirebaseProvider } from './firebase.provider';

jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(),
  getApp: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase-admin', () => ({
  credential: {
    cert: jest.fn(),
  },
}));

describe('FirebaseProvider', () => {
  let provider: FirebaseProvider;
  const mockApp = {};
  const mockAuth = {
    setCustomUserClaims: jest.fn(),
    getUser: jest.fn(),
  };

  beforeEach(async () => {
    (initializeApp as jest.Mock).mockReturnValue(mockApp);
    (getApps as jest.Mock).mockReturnValue([mockApp]);
    (getApp as jest.Mock).mockReturnValue(mockApp);
    (getAuth as jest.Mock).mockReturnValue(mockAuth);
    (fa.credential.cert as jest.Mock).mockReturnValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          useFactory: () => {
            const data: FirebaseConstructorInterface = {
              auth: {
                config: {
                  rolesClaimKey: 'test',
                },
              },
              base64: Buffer.from(JSON.stringify({ project_id: 'test' })).toString('base64'),
            };
            return new FirebaseProvider(data);
          },
          provide: FirebaseProvider,
        },
      ],
    }).compile();

    provider = module.get<FirebaseProvider>(FirebaseProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize app with base64 data', () => {
      const data: FirebaseConstructorInterface = {
        base64: Buffer.from(JSON.stringify({ projectId: 'test' })).toString('base64'),
      };
      new FirebaseProvider(data);
      expect(initializeApp).toHaveBeenCalledWith({
        credential: expect.any(Object),
      });
    });

    it('should initialize app with options', () => {
      const data: FirebaseConstructorInterface = {
        options: { projectId: 'test' },
      };
      new FirebaseProvider(data);
      expect(initializeApp).toHaveBeenCalledWith(data.options);
    });

    it('should initialize default app if no apps are initialized', () => {
      new FirebaseProvider({});
      expect(initializeApp).toHaveBeenCalled();
    });

    it('should use existing app if apps are already initialized', () => {
      (getApps as jest.Mock).mockReturnValue([mockApp]);
      new FirebaseProvider({});
      expect(getApp).toHaveBeenCalled();
    });
  });

  describe('app getter', () => {
    it('should return the app instance', () => {
      expect(provider.app).toBe(mockApp);
    });
  });

  describe('auth getter', () => {
    it('should return the auth instance', () => {
      expect(provider.auth).toBe(mockAuth);
    });
  });

  describe('setClaimsBase', () => {
    it('should set custom claims while preserving role claims', async () => {
      const uid = 'test-uid';
      const newClaims = { premium: true };
      const existingRoles = { test: ['user'] };
      mockAuth.getUser.mockResolvedValue({ customClaims: existingRoles });

      await provider.setClaimsBase(uid, newClaims);

      expect(mockAuth.getUser).toHaveBeenCalledWith(uid);
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        ...newClaims,
        ...existingRoles,
      });
    });
  });

  describe('setClaimsRoleBase', () => {
    it('should set custom user claims', async () => {
      const uid = 'test-uid';
      const claims = ['admin'];
      mockAuth.getUser.mockResolvedValue({ customClaims: {} });
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined);

      await provider.setClaimsRoleBase(uid, claims);
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, { test: claims });
    });
  });

  describe('getClaimsRoleBase', () => {
    it('should get claims from local token when localDecode is true', async () => {
      const claims = ['admin'];
      const userWithClaims = { ...userDecode, test: claims } as any as DecodedIdToken;

      const result = await provider.getClaimsRoleBase(userWithClaims, true);
      expect(result).toEqual(claims);
      expect(mockAuth.getUser).not.toHaveBeenCalled();
    });

    it('should get claims from Firebase when localDecode is false', async () => {
      const user = userDecode as any as DecodedIdToken;
      const claims = ['admin'];
      mockAuth.getUser.mockResolvedValue({ customClaims: { test: claims } });

      const result = await provider.getClaimsRoleBase(user, false);
      expect(mockAuth.getUser).toHaveBeenCalledWith(user.uid);
      expect(result).toEqual(claims);
    });

    it('should return undefined if no custom claims', async () => {
      const user = { ...userDecode } as any as DecodedIdToken;
      mockAuth.getUser.mockResolvedValue({ customClaims: null });

      const localResult = await provider.getClaimsRoleBase(user, true);
      expect(localResult).toBeUndefined();

      const remoteResult = await provider.getClaimsRoleBase(user, false);
      expect(remoteResult).toBeUndefined();
    });
  });
});
