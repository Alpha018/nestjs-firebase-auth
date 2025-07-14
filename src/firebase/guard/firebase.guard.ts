import { ExecutionContext, CanActivate, Injectable, Inject } from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/lib/auth';
import { ExtractJwt } from 'passport-jwt';
import { Reflector } from '@nestjs/core';

import {
  FIREBASE_CLAIMS_USER_METADATA,
  FIREBASE_APP_ROLES_DECORATOR,
  FIREBASE_TOKEN_USER_METADATA,
  FIREBASE_ADMIN_CONFIG,
} from '../constant/firebase.constant';
import { FirebaseConstructorInterface } from '../interface/firebase-constructor.interface';
import { FirebaseProvider } from '../provider/firebase.provider';

@Injectable()
export class FirebaseGuard implements CanActivate {
  constructor(
    private readonly firebaseProvider: FirebaseProvider,
    @Inject(FIREBASE_ADMIN_CONFIG)
    private readonly config: FirebaseConstructorInterface,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      return false;
    }

    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await this.firebaseProvider.auth.verifyIdToken(
        token,
        this.config.auth?.config?.checkRevoked || false,
      );
    } catch {
      return false;
    }

    request['metadata'] = {
      ...request['metadata'],
      [FIREBASE_TOKEN_USER_METADATA]: {
        user: decodedToken,
      },
    };

    if (!this.config.auth?.config?.validateRole) {
      return true;
    }

    const roles = this.reflector.get(FIREBASE_APP_ROLES_DECORATOR, context.getHandler());

    if (!roles) {
      return true;
    }

    const claims = await this.firebaseProvider.getClaimsRoleBase(
      decodedToken,
      this.config.auth?.config?.useLocalRoles || false,
    );

    request['metadata'] = {
      ...request['metadata'],
      [FIREBASE_CLAIMS_USER_METADATA]: {
        claims: claims,
      },
    };

    const requiredRoles = new Set(roles);
    return claims?.some((role) => requiredRoles.has(role));
  }

  private extractTokenFromRequest(request: Request): string | null {
    const extractor =
      this.config.auth?.config?.extractor || ExtractJwt.fromAuthHeaderAsBearerToken();
    return extractor(request);
  }
}
