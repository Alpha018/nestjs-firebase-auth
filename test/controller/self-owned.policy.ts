import { Injectable } from '@nestjs/common';

import { PolicyContext, PolicyHandler } from '../../src';

/** ABAC fixture: the request must target the same uid as the authenticated caller. */
@Injectable()
export class SelfOwnedPolicyHandler implements PolicyHandler {
  async handle(context: PolicyContext): Promise<void> {
    const requestedUid = (context.request as any).query.uid;
    if (context.user.uid !== requestedUid) {
      throw new Error('The authenticated user does not own this resource');
    }
  }
}

/** Fixture handler never added to any module's providers, to exercise the "unregistered" edge case. */
@Injectable()
export class UnregisteredPolicyHandler implements PolicyHandler {
  async handle(): Promise<void> {}
}
