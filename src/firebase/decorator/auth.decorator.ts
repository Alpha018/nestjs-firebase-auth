import { applyDecorators, CanActivate, SetMetadata, UseGuards, Type } from '@nestjs/common';

import {
  FIREBASE_APP_ROLES_DECORATOR,
  FIREBASE_POLICIES_DECORATOR,
  FIREBASE_CLAIMS_DECORATOR,
} from '../constant/firebase.constant';
import { AuthOptions } from '../interface/auth-options.interface';
import { FirebaseGuard } from '../guard/firebase.guard';
import { PoliciesGuard } from '../policy/policy.guard';
import { ClaimsGuard } from '../claims/claims.guard';

/**
 * Decorator that protects the route with Firebase Authentication, composing
 * roles (RBAC), claims (fine-grained), and policies (ABAC) on the same route.
 *
 * @param options.roles - Same as `@Roles(...)`: passes if the user has any one of them.
 * @param options.claims - Same as `@RequireClaims(...)`: requires every listed claim.
 * @param options.policies - Same as `@Policies(...)`: evaluates each policy handler.
 *
 * Don't combine `@Auth({ claims })`/`@Auth({ policies })` with `@RequireClaims`/`@Policies`
 * on the same route — that registers the corresponding guard twice.
 */
export const Auth = (options?: AuthOptions) => {
  const guards: Type<CanActivate>[] = [FirebaseGuard];
  const metadata: MethodDecorator[] = [];

  if (options?.roles?.length) {
    metadata.push(SetMetadata(FIREBASE_APP_ROLES_DECORATOR, options.roles));
  }

  if (options?.claims?.length) {
    metadata.push(SetMetadata(FIREBASE_CLAIMS_DECORATOR, options.claims));
    guards.push(ClaimsGuard);
  }

  if (options?.policies?.length) {
    metadata.push(SetMetadata(FIREBASE_POLICIES_DECORATOR, options.policies));
    guards.push(PoliciesGuard);
  }

  return applyDecorators(...metadata, UseGuards(...guards));
};
