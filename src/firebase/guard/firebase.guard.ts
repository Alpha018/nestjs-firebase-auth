import { ExecutionContext, CanActivate, Injectable, Inject } from '@nestjs/common';
import { JwtFromRequestFunction, ExtractJwt } from 'passport-jwt';
import { DecodedIdToken } from 'firebase-admin/auth';
import { Reflector } from '@nestjs/core';

import {
  FIREBASE_CLAIMS_USER_METADATA,
  FIREBASE_APP_ROLES_DECORATOR,
  FIREBASE_TOKEN_USER_METADATA,
  FIREBASE_ADMIN_CONFIG,
} from '../constant/firebase.constant';
import {
  InsufficientRoleException,
  TokenNotFoundException,
} from '../error/firebase-auth.exception';
import { FirebaseConstructorInterface } from '../interface/firebase-constructor.interface';
import { mapFirebaseAuthError } from '../error/firebase-auth.handler';
import { FirebaseProvider } from '../provider/firebase.provider';

@Injectable()
/**
 * Class FirebaseGuard
 * @description A NestJS Guard that validates Firebase authentication tokens and checks role-based access.
 *
 * Internal implementation detail, no longer part of the public API — use `@Auth` or `@Roles`
 * instead of applying it directly with `@UseGuards`.
 */
export class FirebaseGuard implements CanActivate {
  /**
   * Creates an instance of FirebaseGuard.
   * @param firebaseProvider Service to handle Firebase authentication and token verification.
   * @param config Firebase Admin SDK configuration.
   * @param reflector Utility to retrieve metadata (roles) from route handlers.
   */
  /** Token extractor resolved once at construction to avoid rebuilding it per request. */
  private readonly extractor: JwtFromRequestFunction;

  constructor(
    private readonly firebaseProvider: FirebaseProvider,
    @Inject(FIREBASE_ADMIN_CONFIG)
    private readonly config: FirebaseConstructorInterface,
    private readonly reflector: Reflector,
  ) {
    this.extractor =
      this.config.auth?.config?.extractor ?? ExtractJwt.fromAuthHeaderAsBearerToken();
  }

  /**
   * Validates incoming requests based on Firebase authentication and optional role requirements.
   * @param context Execution context of the current request.
   * @returns A promise that resolves to `true` if the request is authorized.
   * @throws {FirebaseAuthException} If the token is missing/invalid/expired/revoked (401),
   * or the user lacks a required role (403).
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authConfig = this.config.auth?.config;

    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new TokenNotFoundException();
    }

    // Optimization: Check if the user is already attached to request to avoid redundant verification
    // This handles cases where the guard is applied multiple times (e.g. global + composed decorator)
    if (request.metadata?.[FIREBASE_TOKEN_USER_METADATA]) {
      const decodedToken = request.metadata[FIREBASE_TOKEN_USER_METADATA].user;
      return this.handleRoleValidation(
        context,
        request,
        decodedToken,
        authConfig?.useLocalDecode ?? authConfig?.useLocalRoles ?? false,
      );
    }

    const decodedToken = await this.verifyToken(token, authConfig?.checkRevoked ?? false);

    this.attachUserToRequest(request, decodedToken);

    if (!authConfig?.validateRole) {
      return true;
    }

    return this.handleRoleValidation(
      context,
      request,
      decodedToken,
      authConfig?.useLocalDecode ?? authConfig?.useLocalRoles ?? false,
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
    const requiredRoles = this.reflector.getAllAndOverride(FIREBASE_APP_ROLES_DECORATOR, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const userRoles = await this.firebaseProvider.getClaimsRoleBase(decodedToken, useLocalRoles);
    this.attachClaimsToRequest(request, userRoles);

    const requiredRolesSet = new Set(requiredRoles);
    const hasRequiredRole = userRoles?.some((role) => requiredRolesSet.has(role)) ?? false;

    if (!hasRequiredRole) {
      throw new InsufficientRoleException();
    }

    return true;
  }

  /**
   * Verifies the Firebase ID token.
   * @param token The ID token to verify.
   * @param checkRevoked Whether to check if the token has been revoked.
   * @returns The decoded token.
   * @throws {FirebaseAuthException} If the token is missing, invalid, expired, or revoked.
   */
  private async verifyToken(token: string, checkRevoked: boolean): Promise<DecodedIdToken> {
    try {
      return await this.firebaseProvider.auth.verifyIdToken(token, checkRevoked);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
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

  /**
   * Extracts a JWT token from the Authorization header.
   * @param request The HTTP request object.
   * @returns The extracted token or `null` if not present.
   */
  private extractTokenFromRequest(request: any): string | null {
    return this.extractor(request);
  }
}
