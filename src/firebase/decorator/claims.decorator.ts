import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FIREBASE_CLAIMS_USER_METADATA } from '../constant/firebase.constant';

export const ClaimsFactory = (data: unknown, ctx: ExecutionContext) => {
  const context = ctx.switchToHttp();
  const request = context.getRequest();
  return request.metadata?.[FIREBASE_CLAIMS_USER_METADATA as string];
};

export const FirebaseUserClaims = createParamDecorator(ClaimsFactory);
