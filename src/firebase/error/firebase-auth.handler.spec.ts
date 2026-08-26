import { HttpStatus } from '@nestjs/common';

import {
  TokenExpiredException,
  TokenInvalidException,
  TokenRevokedException,
} from './firebase-auth.exception';
import { mapFirebaseAuthError } from './firebase-auth.handler';
import { FirebaseAuthErrorCode } from './firebase-auth.code';

describe('mapFirebaseAuthError', () => {
  it('maps auth/id-token-expired to TokenExpiredException', () => {
    const result = mapFirebaseAuthError({ code: 'auth/id-token-expired' });

    expect(result).toBeInstanceOf(TokenExpiredException);
    expect(result.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(result.getResponse()).toMatchObject({ code: FirebaseAuthErrorCode.TOKEN_EXPIRED });
  });

  it('maps auth/id-token-revoked to TokenRevokedException', () => {
    const result = mapFirebaseAuthError({ code: 'auth/id-token-revoked' });

    expect(result).toBeInstanceOf(TokenRevokedException);
    expect(result.getResponse()).toMatchObject({ code: FirebaseAuthErrorCode.TOKEN_REVOKED });
  });

  it('falls back to TokenInvalidException for unrecognized errors', () => {
    expect(mapFirebaseAuthError(new Error('boom'))).toBeInstanceOf(TokenInvalidException);
    expect(mapFirebaseAuthError({ code: 'auth/argument-error' })).toBeInstanceOf(
      TokenInvalidException,
    );
    expect(mapFirebaseAuthError(undefined)).toBeInstanceOf(TokenInvalidException);
  });
});
