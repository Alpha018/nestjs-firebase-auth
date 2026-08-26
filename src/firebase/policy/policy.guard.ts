import { ExecutionContext, CanActivate, Injectable } from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';

import {
  FIREBASE_CLAIMS_USER_METADATA,
  FIREBASE_TOKEN_USER_METADATA,
  FIREBASE_POLICIES_DECORATOR,
} from '../constant/firebase.constant';
import { PolicyViolationException } from '../error/firebase-auth.exception';
import { PolicyContext } from '../interface/policy-context.interface';
import { PolicyReference } from '../interface/policy.interface';

/**
 * Evaluates the policies set by `@Policies()` (standalone or via `@Auth({ policies })`)
 * against the authenticated user. Must run after `FirebaseGuard`, which is the one
 * that attaches the decoded user to the request.
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policies = this.reflector.getAllAndOverride<PolicyReference[]>(
      FIREBASE_POLICIES_DECORATOR,
      [context.getHandler(), context.getClass()],
    );

    if (!policies?.length) {
      return true;
    }

    const policyContext = this.buildPolicyContext(context);

    try {
      await Promise.all(policies.map((policy) => this.evaluate(policy, policyContext)));
    } catch (error) {
      throw new PolicyViolationException(error instanceof Error ? error.message : undefined);
    }

    return true;
  }

  private buildPolicyContext(context: ExecutionContext): PolicyContext {
    const request = context.switchToHttp().getRequest();
    return {
      claims: request.metadata?.[FIREBASE_CLAIMS_USER_METADATA]?.claims,
      user: request.metadata?.[FIREBASE_TOKEN_USER_METADATA]?.user,
      request,
    };
  }

  private evaluate(policyReference: PolicyReference, policyContext: PolicyContext): Promise<void> {
    const handler =
      typeof policyReference === 'function'
        ? this.moduleRef.get(policyReference, { strict: false })
        : policyReference;

    return handler.handle(policyContext);
  }
}
