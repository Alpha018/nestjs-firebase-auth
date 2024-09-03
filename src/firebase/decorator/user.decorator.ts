import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FIREBASE_TOKEN_USER_METADATA } from '../constant/firebase.constant';

export const UserFactory = (data: unknown, ctx: ExecutionContext) => {
  const context = ctx.switchToHttp();
  const request = context.getRequest();
  return request.metadata[FIREBASE_TOKEN_USER_METADATA as string];
};

export const FirebaseUser = createParamDecorator(UserFactory);
