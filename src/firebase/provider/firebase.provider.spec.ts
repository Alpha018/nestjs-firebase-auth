import { Test, TestingModule } from '@nestjs/testing';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { FirebaseProvider } from './firebase.provider';
import { FirebaseConstructorInterface } from '../interface/firebase-constructor.interface';
import { getAuth } from 'firebase-admin/auth';
import * as fa from 'firebase-admin';

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
          provide: FirebaseProvider,
          useFactory: () => {
            const data: FirebaseConstructorInterface = {
              base64: Buffer.from(JSON.stringify({ project_id: 'test' })).toString('base64'),
            };
            return new FirebaseProvider(data);
          },
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

  describe('setClaimsRoleBase', () => {
    it('should set custom user claims', async () => {
      const uid = 'test-uid';
      const claims = ['admin'];
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined);

      await provider.setClaimsRoleBase(uid, claims);
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, { roles: claims });
    });
  });

  describe('getClaimsRoleBase', () => {
    it('should get custom user claims', async () => {
      const uid = 'test-uid';
      const claims = ['admin'];
      mockAuth.getUser.mockResolvedValue({
        customClaims: { roles: claims },
      });

      const result = await provider.getClaimsRoleBase(uid);
      expect(result).toEqual(claims);
    });

    it('should return undefined if no custom claims', async () => {
      const uid = 'test-uid';
      mockAuth.getUser.mockResolvedValue({
        customClaims: undefined,
      });

      const result = await provider.getClaimsRoleBase(uid);
      expect(result).toBeUndefined();
    });
  });
});
