import { HttpException, HttpStatus } from '@nestjs/common';

import { FirebaseAuthErrorCode } from './firebase-auth.code';

/**
 * Base class for every authentication/authorization error raised by `FirebaseGuard`.
 * Carries a stable `code` alongside the HTTP status so consumers can branch on the
 * failure reason instead of parsing the message.
 */
export abstract class FirebaseAuthException extends HttpException {
  protected constructor(status: HttpStatus, code: FirebaseAuthErrorCode, message: string) {
    super({ statusCode: status, message, code }, status);
  }
}

export class PolicyViolationException extends FirebaseAuthException {
  constructor(reason?: string) {
    super(
      HttpStatus.FORBIDDEN,
      FirebaseAuthErrorCode.POLICY_VIOLATION,
      reason ?? 'The authenticated user does not satisfy the required policy',
    );
  }
}

export class InsufficientClaimsException extends FirebaseAuthException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      FirebaseAuthErrorCode.INSUFFICIENT_CLAIMS,
      'The authenticated user does not have the required claims',
    );
  }
}

export class InsufficientRoleException extends FirebaseAuthException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      FirebaseAuthErrorCode.INSUFFICIENT_ROLE,
      'The authenticated user does not have the required role',
    );
  }
}

export class TokenNotFoundException extends FirebaseAuthException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      FirebaseAuthErrorCode.TOKEN_NOT_FOUND,
      'No authentication token was found in the request',
    );
  }
}

export class TokenRevokedException extends FirebaseAuthException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      FirebaseAuthErrorCode.TOKEN_REVOKED,
      'The authentication token has been revoked',
    );
  }
}

export class TokenExpiredException extends FirebaseAuthException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      FirebaseAuthErrorCode.TOKEN_EXPIRED,
      'The authentication token has expired',
    );
  }
}

export class TokenInvalidException extends FirebaseAuthException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      FirebaseAuthErrorCode.TOKEN_INVALID,
      'The authentication token is invalid',
    );
  }
}
