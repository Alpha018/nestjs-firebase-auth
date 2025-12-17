import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { FIREBASE_APP_ROLES_DECORATOR } from '../constant/firebase.constant';
import { FirebaseGuard } from '../guard/firebase.guard';

/**
 * Decorator that sets the allowed roles for a route handler.
 * It also automatically applies the `FirebaseGuard` to ensure the user is authenticated.
 *
 * @param roles - List of acceptable roles.
 * @returns     Decorator composed of `SetMetadata` and `UseGuards`.
 */
export const Roles = <T>(...roles: T[]) =>
  applyDecorators(SetMetadata(FIREBASE_APP_ROLES_DECORATOR, roles), UseGuards(FirebaseGuard));

/**
 * @deprecated Use `@Roles` instead. This decorator will be removed in future versions.
 */
export const RolesGuard = <T>(...roles: T[]) => Roles(...roles);
