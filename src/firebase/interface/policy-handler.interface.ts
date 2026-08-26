import { PolicyContext } from './policy-context.interface';

/**
 * Contract every policy handler must implement. Mirrors `CanActivate`: this is the
 * whole policy, not just its logic, so there's nothing else to define or register.
 *
 * @throws Reject the request by throwing from `handle`; `PoliciesGuard` wraps
 * whatever is thrown into a `PolicyViolationException`.
 */
export interface PolicyHandler {
  handle(context: PolicyContext): Promise<void>;
}
