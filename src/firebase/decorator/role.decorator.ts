import { SetMetadata } from '@nestjs/common';

import { FIREBASE_APP_ROLES_DECORATOR } from '../constant/firebase.constant';

/**
 * Decorator that sets the allowed roles for a route handler.
 *
 * @param roles - List of acceptable roles.
 * @returns     Metadata decorator used by guards to check permissions.
 */
export const RolesGuard = <T>(...roles: T[]) => SetMetadata(FIREBASE_APP_ROLES_DECORATOR, roles);
