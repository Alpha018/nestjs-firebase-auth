import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { FIREBASE_POLICIES_DECORATOR } from '../constant/firebase.constant';
import { PolicyReference } from '../interface/policy.interface';
import { FirebaseGuard } from '../guard/firebase.guard';
import { PoliciesGuard } from '../policy/policy.guard';

/**
 * Decorator that sets the policies (ABAC) required for a route handler.
 * It also applies `FirebaseGuard` and `PoliciesGuard`, so the route is both
 * authenticated and policy-checked.
 *
 * @param policies - `PolicyHandler`s to evaluate, same as `@UseGuards()`: pass the class
 * to resolve it through Nest's DI (`ResourceOwnerPolicyHandler`), or an instance for a
 * handler that needs a literal parameter DI can't provide (`new MinAgePolicyHandler(18)`).
 */
export const Policies = (...policies: PolicyReference[]) =>
  applyDecorators(
    SetMetadata(FIREBASE_POLICIES_DECORATOR, policies),
    UseGuards(FirebaseGuard, PoliciesGuard),
  );
