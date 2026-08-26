/* eslint-disable perfectionist/sort-modules -- ActiveSubscriptionPolicyHandler references
   SubscriptionsService and FeatureFlagsService as constructor param types (design:paramtypes);
   alphabetical order would move it ahead of both, causing a TDZ error at import time. A
   disable-next-line on just the affected classes doesn't work here: the autofixer reorders the
   whole list as one operation and drags the comment along with whichever class it moves. */
import { ExecutionContext, Injectable, Type } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';

import { FIREBASE_TOKEN_USER_METADATA } from '../constant/firebase.constant';
import { PolicyContext } from '../interface/policy-context.interface';
import { PolicyHandler } from '../interface/policy-handler.interface';
import { PoliciesGuard } from './policy.guard';

/**
 * Exercises every handler shown in docs/wiki/usage/Authorization-Policies.md, so the
 * documented examples stay correct as the library evolves. Each handler here is a
 * copy of its doc counterpart, not an import, since the doc's code blocks aren't
 * compiled: this is what keeps them honest.
 */

// "Injecting services into a handler"
abstract class SubscriptionsService {
  abstract findByUid(uid: string): Promise<{ isActive: boolean } | null>;
}

class FeatureFlagsService {}

@Injectable()
class ActiveSubscriptionPolicyHandler implements PolicyHandler {
  constructor(
    private readonly subscriptions: SubscriptionsService,
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  async handle(context: PolicyContext): Promise<void> {
    const subscription = await this.subscriptions.findByUid(context.user.uid);
    if (!subscription?.isActive) {
      throw new Error('An active subscription is required');
    }
  }
}

// "Policies with parameters"
@Injectable()
class MinAgePolicyHandler implements PolicyHandler {
  constructor(private readonly minAge: number) {}

  async handle(context: PolicyContext): Promise<void> {
    const claims = context.claims as { birthYear?: number };
    const age = new Date().getFullYear() - (claims?.birthYear ?? 0);

    if (age < this.minAge) {
      throw new Error(`Must be at least ${this.minAge} years old`);
    }
  }
}

// "Multi-tenant / organization membership"
@Injectable()
class SameOrganizationPolicyHandler implements PolicyHandler {
  async handle(context: PolicyContext): Promise<void> {
    const claims = context.claims as { orgId?: string };
    const request = context.request as { params: { orgId: string } };

    if (claims?.orgId !== request.params.orgId) {
      throw new Error('You do not belong to this organization');
    }
  }
}

// "Defining a policy handler"
@Injectable()
class ResourceOwnerPolicyHandler implements PolicyHandler {
  async handle(context: PolicyContext): Promise<void> {
    const request = context.request as { params: { ownerId: string } };
    if (context.user.uid !== request.params.ownerId) {
      throw new Error('You do not own this resource');
    }
  }
}

// "Checks that don't depend on the request"
@Injectable()
class BusinessHoursPolicyHandler implements PolicyHandler {
  async handle(): Promise<void> {
    const hour = new Date().getUTCHours();
    if (hour < 9 || hour >= 18) {
      throw new Error('This action is only available during business hours (09:00-18:00 UTC)');
    }
  }
}

// "A parameter and injected services at the same time"
abstract class UserRepository {
  abstract findByUid(uid: string): Promise<{ birthDate: Date } | null>;
}

function calculateAge(birthDate: Date): number {
  return new Date().getFullYear() - birthDate.getFullYear();
}

function minAgePolicyHandler(minAge: number): Type<PolicyHandler> {
  @Injectable()
  class GeneratedMinAgePolicyHandler implements PolicyHandler {
    constructor(private readonly userRepository: UserRepository) {}

    async handle(context: PolicyContext): Promise<void> {
      const user = await this.userRepository.findByUid(context.user.uid);
      if (!user || calculateAge(user.birthDate) < minAge) {
        throw new Error(`Must be at least ${minAge} years old`);
      }
    }
  }

  return GeneratedMinAgePolicyHandler;
}

function buildContext(overrides: Partial<PolicyContext> = {}): PolicyContext {
  return {
    user: { uid: 'user-1' } as PolicyContext['user'],
    claims: undefined,
    request: {},
    ...overrides,
  };
}

describe('Authorization-Policies.md examples', () => {
  describe('ResourceOwnerPolicyHandler', () => {
    const handler = new ResourceOwnerPolicyHandler();

    it('allows the owner', async () => {
      const context = buildContext({ request: { params: { ownerId: 'user-1' } } });
      await expect(handler.handle(context)).resolves.toBeUndefined();
    });

    it('rejects a caller who is not the owner', async () => {
      const context = buildContext({ request: { params: { ownerId: 'user-2' } } });
      await expect(handler.handle(context)).rejects.toThrow('You do not own this resource');
    });
  });

  describe('ActiveSubscriptionPolicyHandler', () => {
    it('allows a caller with an active subscription', async () => {
      const subscriptions = { findByUid: jest.fn().mockResolvedValue({ isActive: true }) };
      const handler = new ActiveSubscriptionPolicyHandler(
        subscriptions as unknown as SubscriptionsService,
        new FeatureFlagsService(),
      );

      await expect(handler.handle(buildContext())).resolves.toBeUndefined();
    });

    it('rejects a caller without an active subscription', async () => {
      const subscriptions = { findByUid: jest.fn().mockResolvedValue({ isActive: false }) };
      const handler = new ActiveSubscriptionPolicyHandler(
        subscriptions as unknown as SubscriptionsService,
        new FeatureFlagsService(),
      );

      await expect(handler.handle(buildContext())).rejects.toThrow(
        'An active subscription is required',
      );
    });
  });

  describe('BusinessHoursPolicyHandler', () => {
    const handler = new BusinessHoursPolicyHandler();

    afterEach(() => {
      jest.useRealTimers();
    });

    it('allows requests during business hours', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-01-01T10:00:00Z'));
      await expect(handler.handle()).resolves.toBeUndefined();
    });

    it('rejects requests outside business hours', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-01-01T22:00:00Z'));
      await expect(handler.handle()).rejects.toThrow(
        'This action is only available during business hours (09:00-18:00 UTC)',
      );
    });
  });

  describe('SameOrganizationPolicyHandler', () => {
    const handler = new SameOrganizationPolicyHandler();

    it('allows a caller from the same organization', async () => {
      const context = buildContext({
        request: { params: { orgId: 'org-1' } },
        claims: { orgId: 'org-1' },
      });

      await expect(handler.handle(context)).resolves.toBeUndefined();
    });

    it('rejects a caller from a different organization', async () => {
      const context = buildContext({
        request: { params: { orgId: 'org-2' } },
        claims: { orgId: 'org-1' },
      });

      await expect(handler.handle(context)).rejects.toThrow(
        'You do not belong to this organization',
      );
    });
  });

  describe('MinAgePolicyHandler', () => {
    const currentYear = new Date().getFullYear();

    it('allows a caller old enough', async () => {
      const handler = new MinAgePolicyHandler(18);
      const context = buildContext({ claims: { birthYear: currentYear - 20 } });

      await expect(handler.handle(context)).resolves.toBeUndefined();
    });

    it('rejects a caller too young', async () => {
      const handler = new MinAgePolicyHandler(21);
      const context = buildContext({ claims: { birthYear: currentYear - 18 } });

      await expect(handler.handle(context)).rejects.toThrow('Must be at least 21 years old');
    });
  });

  describe('minAgePolicyHandler (class factory)', () => {
    const currentYear = new Date().getFullYear();

    it('resolves the generated class through Nest DI, with UserRepository injected', async () => {
      const userRepository = {
        findByUid: jest.fn().mockResolvedValue({ birthDate: new Date(currentYear - 20, 0, 1) }),
      };
      const MinAgeAdultPolicy = minAgePolicyHandler(18);

      const module: TestingModule = await Test.createTestingModule({
        providers: [{ useValue: userRepository, provide: UserRepository }, MinAgeAdultPolicy],
      }).compile();

      const handler = module.get(MinAgeAdultPolicy);
      await expect(handler.handle(buildContext())).resolves.toBeUndefined();
      expect(userRepository.findByUid).toHaveBeenCalledWith('user-1');
    });

    it('rejects when the resolved user is too young', async () => {
      const userRepository = {
        findByUid: jest.fn().mockResolvedValue({ birthDate: new Date(currentYear - 10, 0, 1) }),
      };
      const MinAgeAdultPolicy = minAgePolicyHandler(18);

      const module: TestingModule = await Test.createTestingModule({
        providers: [{ useValue: userRepository, provide: UserRepository }, MinAgeAdultPolicy],
      }).compile();

      const handler = module.get(MinAgeAdultPolicy);
      await expect(handler.handle(buildContext())).rejects.toThrow('Must be at least 18 years old');
    });

    it('resolves through PoliciesGuard exactly like @Policies() would at request time', async () => {
      const userRepository = {
        findByUid: jest.fn().mockResolvedValue({ birthDate: new Date(currentYear - 20, 0, 1) }),
      };
      const MinAgeAdultPolicy = minAgePolicyHandler(18);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PoliciesGuard,
          Reflector,
          { useValue: userRepository, provide: UserRepository },
          MinAgeAdultPolicy,
        ],
      }).compile();

      const guard = module.get(PoliciesGuard);
      const reflector = module.get(Reflector);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([MinAgeAdultPolicy]);

      const request = {
        metadata: { [FIREBASE_TOKEN_USER_METADATA]: { user: { uid: 'user-1' } } },
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(userRepository.findByUid).toHaveBeenCalledWith('user-1');
    });
  });
});
