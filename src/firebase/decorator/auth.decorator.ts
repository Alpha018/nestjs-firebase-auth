import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { FIREBASE_POLICIES_DECORATOR } from '../constant/firebase.constant';
import { AuthOptions } from '../interface/auth-options.interface';
import { FirebaseGuard } from '../guard/firebase.guard';
import { PoliciesGuard } from '../policy/policy.guard';

/**
 * Decorator that protects the route with Firebase Authentication.
 * It ensures the request has a valid Firebase token.
 *
 * @param options.policies - When set, also applies `PoliciesGuard` and the given
 * policies. Equivalent to combining `@Auth()` with `@Policies(...)`; do not use
 * both decorators on the same route to avoid registering `PoliciesGuard` twice.
 * @returns Decorator composed of `UseGuards(FirebaseGuard)`, and `PoliciesGuard` when `policies` is given.
 */
export const Auth = (options?: AuthOptions) => {
  if (!options?.policies?.length) {
    return applyDecorators(UseGuards(FirebaseGuard));
  }

  return applyDecorators(
    SetMetadata(FIREBASE_POLICIES_DECORATOR, options.policies),
    UseGuards(FirebaseGuard, PoliciesGuard),
  );
};
