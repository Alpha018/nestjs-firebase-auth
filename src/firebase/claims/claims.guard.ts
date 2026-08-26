import { ExecutionContext, CanActivate, Injectable, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  FIREBASE_TOKEN_USER_METADATA,
  FIREBASE_CLAIMS_DECORATOR,
  FIREBASE_ADMIN_CONFIG,
} from '../constant/firebase.constant';
import { FirebaseConstructorInterface } from '../interface/firebase-constructor.interface';
import { InsufficientClaimsException } from '../error/firebase-auth.exception';
import { FirebaseProvider } from '../provider/firebase.provider';

/**
 * Evaluates the fine-grained claims set by `@RequireClaims()` (standalone or via
 * `@Auth({ claims })`) against the authenticated user. Must run after `FirebaseGuard`,
 * which is the one that attaches the decoded user to the request.
 */
@Injectable()
export class ClaimsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly firebaseProvider: FirebaseProvider,
    @Inject(FIREBASE_ADMIN_CONFIG)
    private readonly config: FirebaseConstructorInterface,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredClaims = this.reflector.getAllAndOverride<unknown[]>(FIREBASE_CLAIMS_DECORATOR, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredClaims?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.metadata?.[FIREBASE_TOKEN_USER_METADATA]?.user;
    const useLocalDecode =
      this.config?.auth?.config?.useLocalDecode ??
      this.config?.auth?.config?.useLocalRoles ??
      false;
    const userClaims = await this.firebaseProvider.getClaimsPermissionBase(user, useLocalDecode);

    const satisfied = requiredClaims.every((claim) => userClaims?.includes(claim));

    if (!satisfied) {
      throw new InsufficientClaimsException();
    }

    return true;
  }
}
