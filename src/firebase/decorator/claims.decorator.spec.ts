import { ExecutionContext } from '@nestjs/common';
import { ClaimsFactory } from './claims.decorator';
import { FIREBASE_CLAIMS_USER_METADATA } from '../constant/firebase.constant';

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

describe('Firebase Claims Decorator - Unit Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract the claims from the request context in an HTTP context', () => {
    const mockClaims = {
      claims: 'test_claims',
    };

    jest.spyOn(mockExecutionContext, 'getType').mockReturnValue('http');

    const mockRequest = {
      metadata: {
        [FIREBASE_CLAIMS_USER_METADATA]: mockClaims,
      },
    };

    jest.spyOn(mockExecutionContext, 'switchToHttp').mockReturnValue({
      getRequest: () => mockRequest,
    } as any);

    const result = ClaimsFactory(null, mockExecutionContext);

    expect(result).toEqual(mockClaims);
  });
});
