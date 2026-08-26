import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';

import { FirebaseConstructorInterface } from '../interface/firebase-constructor.interface';
import { userDecode } from '../__mocks__/firebase-user-mock';
import { FirebaseProvider } from './firebase.provider';

jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(),
  getApp: jest.fn(),
  cert: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

describe('FirebaseProvider', () => {
  let provider: FirebaseProvider;
  const mockApp = { name: 'mockApp' };
  const mockAuth = {
    setCustomUserClaims: jest.fn(),
    getUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (initializeApp as jest.Mock).mockReturnValue(mockApp);
    (getApps as jest.Mock).mockReturnValue([mockApp]);
    (getApp as jest.Mock).mockReturnValue(mockApp);
    (getAuth as jest.Mock).mockReturnValue(mockAuth);
    (cert as jest.Mock).mockReturnValue({});

    const data: FirebaseConstructorInterface = {
      base64: Buffer.from(JSON.stringify({ project_id: 'test' })).toString('base64'),
      auth: {
        config: {
          rolesClaimKey: 'test',
        },
      },
    };
    provider = new FirebaseProvider(data);
  });

  it('should use default roles key if config is missing', () => {
    const data: FirebaseConstructorInterface = {
      base64: Buffer.from(JSON.stringify({ project_id: 'test' })).toString('base64'),
      auth: {
        config: {} as any,
      },
    };
    const localProvider = new FirebaseProvider(data);
    // Access private property logic via a public method dependent on it, or mock property if possible.
    // Since rolesKey is private, we can verify behavior of getClaimsRoleBase which uses it.
    // But rolesKey logic is simple: this.data.auth?.config?.rolesClaimKey ?? FIREBASE_APP_ROLES_DEFAULT_DECORATOR;
    // Let's verify it explicitly if we can cast to any, or rely on coverage report.
    expect((localProvider as any).rolesKey).toBe('roles'); // Default const value
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize app with base64 data', () => {
      (getApps as jest.Mock).mockReturnValue([]);
      const data: FirebaseConstructorInterface = {
        base64: Buffer.from(JSON.stringify({ projectId: 'test' })).toString('base64'),
      };
      new FirebaseProvider(data);
      expect(initializeApp).toHaveBeenCalledWith({
        credential: expect.any(Object),
      });
    });

    it('should initialize app with options', () => {
      (getApps as jest.Mock).mockReturnValue([]);
      const data: FirebaseConstructorInterface = {
        options: { projectId: 'test' },
      };
      new FirebaseProvider(data);
      expect(initializeApp).toHaveBeenCalledWith(data.options);
    });

    it('should initialize default app if no apps are initialized', () => {
      (getApps as jest.Mock).mockReturnValue([]);
      new FirebaseProvider({});
      expect(initializeApp).toHaveBeenCalled();
    });

    it('should use existing app if apps are already initialized', () => {
      (getApps as jest.Mock).mockReturnValue([mockApp]);
      new FirebaseProvider({});
      expect(getApp).toHaveBeenCalled();
      expect(initializeApp).not.toHaveBeenCalled();
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
    it('should set custom claims while preserving role and fine-grained claims', async () => {
      const uid = 'test-uid';
      const newClaims = { premium: true, other: 'new' };
      const existingClaims = { permissions: ['users:read'], test: ['user'], other: 'old' };
      mockAuth.getUser.mockResolvedValue({ customClaims: existingClaims });

      await provider.setClaimsBase(uid, newClaims);

      expect(mockAuth.getUser).toHaveBeenCalledWith(uid);
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        ...existingClaims,
        ...newClaims,
        permissions: existingClaims.permissions, // fine-grained claims are preserved
        test: existingClaims.test, // roles are preserved
      });
    });
  });

  describe('setClaimsRoleBase', () => {
    it('should set/overwrite role claims while preserving other claims', async () => {
      const uid = 'test-uid';
      const newRoles = ['admin'];
      const existingClaims = { test: ['user'], other: 'foo' };
      mockAuth.getUser.mockResolvedValue({ customClaims: existingClaims });
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined);

      await provider.setClaimsRoleBase(uid, newRoles);
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        ...existingClaims,
        test: newRoles,
      });
    });

    it('should handle undefined customClaims when setting role claims', async () => {
      const uid = 'test-uid';
      const newRoles = ['admin'];
      mockAuth.getUser.mockResolvedValue({ customClaims: undefined });
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined);

      await provider.setClaimsRoleBase(uid, newRoles);
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        test: newRoles,
      });
    });
  });

  describe('getClaimsRoleBase', () => {
    it('should get claims from local token when localDecode is true', async () => {
      const claims = ['admin'];
      const userWithClaims = {
        ...userDecode,
        test: claims,
      } as any as DecodedIdToken;

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

    it('should return undefined instead of crashing when user is undefined and localDecode is false', async () => {
      const result = await provider.getClaimsRoleBase(undefined as any, false);
      expect(result).toBeUndefined();
      expect(mockAuth.getUser).not.toHaveBeenCalled();
    });

    it('should return undefined instead of crashing when user is null and localDecode is false', async () => {
      const result = await provider.getClaimsRoleBase(null as any, false);
      expect(result).toBeUndefined();
      expect(mockAuth.getUser).not.toHaveBeenCalled();
    });

    it('should return undefined without touching Firebase when user is undefined and localDecode is true', async () => {
      const result = await provider.getClaimsRoleBase(undefined as any, true);
      expect(result).toBeUndefined();
      expect(mockAuth.getUser).not.toHaveBeenCalled();
    });
  });

  describe('getClaimsPermissionBase', () => {
    it('should get claims from local token when localDecode is true', async () => {
      const claims = ['users:read'];
      const userWithClaims = {
        ...userDecode,
        permissions: claims,
      } as any as DecodedIdToken;

      const result = await provider.getClaimsPermissionBase(userWithClaims, true);
      expect(result).toEqual(claims);
      expect(mockAuth.getUser).not.toHaveBeenCalled();
    });

    it('should get claims from Firebase when localDecode is false', async () => {
      const user = userDecode as any as DecodedIdToken;
      const claims = ['users:read'];
      mockAuth.getUser.mockResolvedValue({ customClaims: { permissions: claims } });

      const result = await provider.getClaimsPermissionBase(user, false);
      expect(mockAuth.getUser).toHaveBeenCalledWith(user.uid);
      expect(result).toEqual(claims);
    });

    it('should return undefined instead of crashing when user is undefined and localDecode is false', async () => {
      const result = await provider.getClaimsPermissionBase(undefined as any, false);
      expect(result).toBeUndefined();
      expect(mockAuth.getUser).not.toHaveBeenCalled();
    });

    it('should return undefined instead of crashing when user is null and localDecode is false', async () => {
      const result = await provider.getClaimsPermissionBase(null as any, false);
      expect(result).toBeUndefined();
      expect(mockAuth.getUser).not.toHaveBeenCalled();
    });

    it('should return undefined without touching Firebase when user is null and localDecode is true', async () => {
      const result = await provider.getClaimsPermissionBase(null as any, true);
      expect(result).toBeUndefined();
      expect(mockAuth.getUser).not.toHaveBeenCalled();
    });
  });

  describe('setClaimsBase', () => {
    it('should treat a null customClaims value as no existing claims', async () => {
      const uid = 'test-uid';
      const newClaims = { premium: true };
      mockAuth.getUser.mockResolvedValue({ customClaims: null });

      await provider.setClaimsBase(uid, newClaims);

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        ...newClaims,
        permissions: undefined,
        test: undefined,
      });
    });

    it('should treat a missing customClaims key as no existing claims', async () => {
      const uid = 'test-uid';
      const newClaims = { premium: true };
      mockAuth.getUser.mockResolvedValue({});

      await provider.setClaimsBase(uid, newClaims);

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        ...newClaims,
        permissions: undefined,
        test: undefined,
      });
    });
  });

  describe('setClaimsPermissionBase', () => {
    it('should treat a null customClaims value as no existing claims', async () => {
      const uid = 'test-uid';
      const newClaims = ['users:read'];
      mockAuth.getUser.mockResolvedValue({ customClaims: null });

      await provider.setClaimsPermissionBase(uid, newClaims);

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        permissions: newClaims,
      });
    });
  });

  describe('setClaimsRoleBase', () => {
    it('should treat a null customClaims value as no existing claims', async () => {
      const uid = 'test-uid';
      const newRoles = ['admin'];
      mockAuth.getUser.mockResolvedValue({ customClaims: null });

      await provider.setClaimsRoleBase(uid, newRoles);

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        test: newRoles,
      });
    });
  });
});
