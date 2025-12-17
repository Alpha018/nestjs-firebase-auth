import { applyDecorators, UseGuards } from '@nestjs/common';

import { FirebaseGuard } from '../guard/firebase.guard';

/**
 * Decorator that protects the route with Firebase Authentication.
 * It ensures the request has a valid Firebase token.
 *
 * @returns Decorator composed of `UseGuards(FirebaseGuard)`.
 */
export const Auth = () => applyDecorators(UseGuards(FirebaseGuard));
