import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { FIREBASE_CLAIMS_USER_METADATA } from '../constant/firebase.constant';

/**
 * Extracts Firebase custom claims from the request metadata.
 *
 * @param data - data passed to the decorator (unused).
 * @param ctx  - NestJS execution context that provides the HTTP request.
 * @returns    Value stored under `FIREBASE_CLAIMS_USER_METADATA` constant in the request (FIREBASE_CLAIMS_METADATA).
 */
export const ClaimsFactory = (data: unknown, ctx: ExecutionContext) => {
  const context = ctx.switchToHttp();
  const request = context.getRequest();
  return request.metadata?.[FIREBASE_CLAIMS_USER_METADATA as string]?.claims;
};

/**
 * Parameter decorator to access a user’s Firebase claims.
 */
export const FirebaseRolesClaims = createParamDecorator(ClaimsFactory);
