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
/**
 * Class FirebaseGuard
 * @description A NestJS Guard that validates Firebase authentication tokens and checks role-based access.
 *
 * @deprecated Use `@Auth` or `@Roles` decorators instead of using this guard directly.
 * The `FirebaseGuard` class export will be removed in the next major version.
 *
 * Example replacement:
 * - `@UseGuards(FirebaseGuard)` -> `@Auth()`
 * - `@UseGuards(FirebaseGuard)` + `@Roles(...)` -> `@Roles(...)`
 */
export class FirebaseGuard implements CanActivate {
  /**
   * Creates an instance of FirebaseGuard.
   * @param firebaseProvider Service to handle Firebase authentication and token verification.
   * @param config Firebase Admin SDK configuration.
   * @param reflector Utility to retrieve metadata (roles) from route handlers.
   */
  constructor(
    private readonly firebaseProvider: FirebaseProvider,
    @Inject(FIREBASE_ADMIN_CONFIG)
    private readonly config: FirebaseConstructorInterface,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Validates incoming requests based on Firebase authentication and optional role requirements.
   * @param context Execution context of the current request.
   * @returns A promise that resolves to `true` if the request is authorized, otherwise `false`.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authConfig = this.config.auth?.config;

    const token = this.extractTokenFromRequest(request);

    if (!token) {
      return false;
    }

    // Optimization: Check if the user is already attached to request to avoid redundant verification
    // This handles cases where the guard is applied multiple times (e.g. global + composed decorator)
    if (request.metadata?.[FIREBASE_TOKEN_USER_METADATA]) {
      const decodedToken = request.metadata[FIREBASE_TOKEN_USER_METADATA].user;
      return this.handleRoleValidation(
        context,
        request,
        decodedToken,
        authConfig?.useLocalRoles ?? false,
      );
    }

    const decodedToken = await this.verifyToken(token, authConfig?.checkRevoked ?? false);
    if (!decodedToken) {
      return false;
    }

    this.attachUserToRequest(request, decodedToken);

    if (!authConfig?.validateRole) {
      return true;
    }

    return this.handleRoleValidation(
      context,
      request,
      decodedToken,
      authConfig?.useLocalRoles ?? false,
    );
  }

  /**
   * Handles role-based validation for the request.
   * It retrieves the roles required by the route handler, fetches the user's roles,
   * and checks if the user has at least one of the required roles.
   *
   * @param context The execution context, used to access route metadata.
   * @param request The incoming HTTP request object.
   * @param decodedToken The user's decoded Firebase ID token.
   * @param useLocalRoles A flag indicating whether to use roles from the token payload or fetch from Firebase.
   * @returns A promise that resolves to `true` if the user is authorized, otherwise `false`.
   */
  private async handleRoleValidation(
    context: ExecutionContext,
    request: any,
    decodedToken: DecodedIdToken,
    useLocalRoles: boolean,
  ): Promise<boolean> {
    const requiredRoles = this.reflector.get(FIREBASE_APP_ROLES_DECORATOR, context.getHandler());

    if (!requiredRoles) {
      return true;
    }

    const userRoles = await this.firebaseProvider.getClaimsRoleBase(decodedToken, useLocalRoles);
    this.attachClaimsToRequest(request, userRoles);

    if (!userRoles) {
      return false;
    }

    const requiredRolesSet = new Set(requiredRoles);
    return userRoles.some((role) => requiredRolesSet.has(role));
  }

  /**
   * Verifies the Firebase ID token.
   * @param token The ID token to verify.
   * @param checkRevoked Whether to check if the token has been revoked.
   * @returns The decoded token if valid, otherwise `null`.
   */
  private async verifyToken(token: string, checkRevoked: boolean): Promise<DecodedIdToken | null> {
    try {
      return await this.firebaseProvider.auth.verifyIdToken(token, checkRevoked);
    } catch {
      return null;
    }
  }

  /**
   * Extracts a JWT token from the Authorization header.
   * @param request The HTTP request object.
   * @returns The extracted token or `null` if not present.
   */
  private extractTokenFromRequest(request: any): string | null {
    const extractor =
      this.config.auth?.config?.extractor || ExtractJwt.fromAuthHeaderAsBearerToken();
    return extractor(request);
  }

  /**
   * Attaches the decoded user token to the request metadata.
   * @param request The request object.
   * @param user The decoded Firebase ID token.
   */
  private attachUserToRequest(request: any, user: DecodedIdToken): void {
    request.metadata = { ...request.metadata, [FIREBASE_TOKEN_USER_METADATA]: { user } };
  }

  /**
   * Attaches the user's claims to the request metadata.
   * @param request The request object.
   * @param claims The user's custom claims.
   */
  private attachClaimsToRequest(request: any, claims: unknown): void {
    request.metadata = { ...request.metadata, [FIREBASE_CLAIMS_USER_METADATA]: { claims } };
  }
}
