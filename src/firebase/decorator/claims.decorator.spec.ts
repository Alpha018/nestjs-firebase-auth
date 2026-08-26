import { ExecutionContext } from '@nestjs/common';

import {
  FIREBASE_CLAIMS_USER_METADATA,
  FIREBASE_CLAIMS_DECORATOR,
} from '../constant/firebase.constant';
import { ClaimsFactory, RequireClaims } from './claims.decorator';

const mockExecutionContext: ExecutionContext = {
  getArgByIndex: jest.fn(),
  switchToHttp: jest.fn(),
  switchToRpc: jest.fn(),
  getHandler: jest.fn(),
  switchToWs: jest.fn(),
  getClass: jest.fn(),
  getType: jest.fn(),
  getArgs: jest.fn(),
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

    expect(result).toEqual(mockClaims.claims);
  });
});

describe('RequireClaims', () => {
  it('should set metadata with the required claims', () => {
    const claims = ['users:read', 'users:write'];
    const decorator = RequireClaims(...claims);

    function testFunction() {}

    decorator(testFunction);

    const metadata = Reflect.getMetadata(FIREBASE_CLAIMS_DECORATOR, testFunction);
    expect(metadata).toEqual(claims);
  });

  it('should handle no claims', () => {
    const decorator = RequireClaims();

    function testFunction() {}

    decorator(testFunction);

    const metadata = Reflect.getMetadata(FIREBASE_CLAIMS_DECORATOR, testFunction);
    expect(metadata).toEqual([]);
  });
});
