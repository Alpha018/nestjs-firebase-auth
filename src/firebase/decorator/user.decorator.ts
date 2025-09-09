import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { FIREBASE_TOKEN_USER_METADATA } from '../constant/firebase.constant';

/**
 * Retrieves the decoded Firebase user from request metadata.
 *
 * @param data - data passed to the decorator (unused).
 * @param ctx  - NestJS execution context that provides the HTTP request.
 * @returns    Value stored under `FIREBASE_TOKEN_USER_METADATA` constant in the request (FIREBASE_USER_METADATA).
 */
export const UserFactory = (data: unknown, ctx: ExecutionContext) => {
  const context = ctx.switchToHttp();
  const request = context.getRequest();
  return request.metadata[FIREBASE_TOKEN_USER_METADATA as string]?.user;
};

/**
 * Parameter decorator that injects the authenticated Firebase user.
 */
export const FirebaseUser = createParamDecorator(UserFactory);
