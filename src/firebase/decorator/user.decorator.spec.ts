import { ExecutionContext } from '@nestjs/common';
import { FIREBASE_TOKEN_USER_METADATA } from '../constant/firebase.constant';
import { UserFactory } from './user.decorator';

const mockExecutionContext: ExecutionContext = {
  getType: jest.fn(),
  getArgByIndex: jest.fn(),
  getArgs: jest.fn(),
  getClass: jest.fn(),
  getHandler: jest.fn(),
  switchToHttp: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
};

describe('Firebase User Decorator - Unit Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract the user from the request context in an HTTP context', () => {
    const mockClaims = {
      user: 'test_user',
    };

    jest.spyOn(mockExecutionContext, 'getType').mockReturnValue('http');

    const mockRequest = {
      metadata: {
        [FIREBASE_TOKEN_USER_METADATA]: mockClaims,
      },
    };

    jest.spyOn(mockExecutionContext, 'switchToHttp').mockReturnValue({
      getRequest: () => mockRequest,
    } as any);

    const result = UserFactory(null, mockExecutionContext);

    expect(result).toEqual(mockClaims);
  });
});
