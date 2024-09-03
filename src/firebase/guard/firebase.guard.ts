import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { FirebaseProvider } from '../provider/firebase.provider';
import { FirebaseConstructorInterface } from '../interface/firebase-constructor.interface';
import {
  FIREBASE_ADMIN_CONFIG,
  FIREBASE_APP_ROLES_DECORATOR,
  FIREBASE_CLAIMS_USER_METADATA,
  FIREBASE_TOKEN_USER_METADATA,
} from '../constant/firebase.constant';
import { ExtractJwt } from 'passport-jwt';
import { Reflector } from '@nestjs/core';
import { DecodedIdToken } from 'firebase-admin/lib/auth';

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
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

    const claims = await this.firebaseProvider.getClaimsRoleBase(decodedToken.uid);

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
