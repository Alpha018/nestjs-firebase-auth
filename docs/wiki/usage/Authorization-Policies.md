# Policy-Based Authorization (ABAC)

`@Roles()` answers "what type of user is this?". Some rules need more than that: resource ownership, tenant membership, or any check that depends on runtime context a static role can't express. That's what policies are for.

Since this is a library used by many different projects, it ships only the mechanism (a decorator, a guard, and an interface), not any domain logic. Every policy handler lives in your own application.

> [!NOTE]
> Policies (ABAC) and roles (RBAC) are not mutually exclusive. They commonly layer: a role narrows who can reach a route, a policy adds a contextual check on top. See [Combining roles and policies](#combining-roles-and-policies).

## Prerequisites

`@Policies()` and `@Auth({ policies })` always apply `FirebaseGuard` together with `PoliciesGuard`, so `FirebaseAdminModule.forRoot()` (or `forRootAsync()`) has to be configured for either decorator to work. `FirebaseGuard` is also what fills in `context.user` and `context.claims` before your handler runs.

> [!NOTE]
> `PoliciesGuard` on its own has no Firebase dependency; it only injects `Reflector` and `ModuleRef` from Nest's core. A check that never reads `context.user` or `context.claims` (like [`BusinessHoursPolicyHandler`](#checks-that-dont-depend-on-the-request)) could run behind a plain `@UseGuards(PoliciesGuard)` without Firebase configured at all. That's an edge case, not the intended path: any handler that needs to know who's calling still needs `FirebaseGuard` to have run first.

## The policy contract

A policy **is** a `PolicyHandler`, one class, the same way a `CanActivate` class is the whole of a Nest guard. There's no separate data object to define or register:

```typescript
export interface PolicyHandler {
  handle(context: PolicyContext): Promise<void>;
}
```

`handle()` either resolves (access granted) or throws (access denied). It receives a `PolicyContext` to make its decision:

```typescript
export interface PolicyContext {
  user: DecodedIdToken; // the authenticated user, attached by FirebaseGuard
  claims: unknown; // custom claims, if role validation already ran
  request: unknown; // the raw HTTP request (params, query, body, headers)
}
```

## Defining a policy handler

One class, a normal `@Injectable()`, exactly like writing a Nest guard:

```typescript
import { Injectable } from '@nestjs/common';
import { PolicyContext, PolicyHandler } from '@alpha018/nestjs-firebase-auth';

@Injectable()
export class ResourceOwnerPolicyHandler implements PolicyHandler {
  async handle(context: PolicyContext): Promise<void> {
    const request = context.request as { params: { ownerId: string } };
    if (context.user.uid !== request.params.ownerId) {
      throw new Error('You do not own this resource');
    }
  }
}
```

Add it to a module's `providers`, same as any other injectable:

```typescript
@Module({
  controllers: [InvoicesController],
  providers: [ResourceOwnerPolicyHandler],
})
export class InvoicesModule {}
```

That's the whole setup. No registry, no separate registration call: the same way you'd never register a `CanActivate` guard anywhere beyond `providers` and `@UseGuards()`.

## Applying policies to a route

`@Policies()` works exactly like `@UseGuards()`: pass the class to resolve it through Nest's DI container, or pass an instance built with `new` when the handler needs a literal parameter DI can't supply.

```typescript
// Standalone
@Policies(ResourceOwnerPolicyHandler)
@Get(':ownerId')
getResource(@Param('ownerId') ownerId: string) { ... }

// Composed with authentication
@Auth({ policies: [ResourceOwnerPolicyHandler] })
@Get(':ownerId')
getResource(@Param('ownerId') ownerId: string) { ... }
```

> [!IMPORTANT]
> Both forms already include `FirebaseGuard`. Don't put `@Policies()` and `@Auth({ policies })` on the same route: each one applies `PoliciesGuard` on its own, so combining them registers the guard twice for no benefit.

> [!IMPORTANT]
> If `@Policies()` references a class that isn't provided anywhere in the app (missing from every module's `providers`), `PoliciesGuard` rejects the request with a `403 PolicyViolationException` instead of a raw framework error or a silent bypass. Same failure mode as forgetting to register a `CanActivate` guard.

### Class reference or instance?

| The handler... | Pass it as... | Example |
|---|---|---|
| needs nothing beyond injected services and the request | a bare class, resolved through DI | `@Policies(ResourceOwnerPolicyHandler)` |
| needs a literal value fixed when you write the route, and no injected services | an instance | `@Policies(new MinAgePolicyHandler(18))` |
| needs both a literal value *and* injected services | a class factory (still passed bare) | see [A parameter and injected services at the same time](#a-parameter-and-injected-services-at-the-same-time) |

A constructor parameter on an instance is evaluated once, when `@Policies()` runs at module load, so it can only ever hold a value your code already knows at that point, not a route param, not anything from the request:

```typescript
// Doesn't work: orgId isn't available yet. @Policies() runs once, when the module
// loads, not per request, so there's nothing to pass to the constructor here.
@Policies(new SameOrganizationPolicyHandler(orgId))
@Get(':orgId/invoices')
getInvoices(@Param('orgId') orgId: string) { ... }
```

A value that depends on the request has to be read inside `handle()` instead, from `context.request`. See [Multi-tenant / organization membership](#multi-tenant--organization-membership).

## Complex examples

### Injecting services into a handler

A handler passed by class is resolved through Nest's DI container, so it can inject as many services as it needs, the same as any other `@Injectable()`:

```typescript
@Injectable()
export class ActiveSubscriptionPolicyHandler implements PolicyHandler {
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
```

```typescript
@Policies(ActiveSubscriptionPolicyHandler)
@Get('premium-report')
getPremiumReport() { ... }
```

> [!NOTE]
> A service from another module has to be visible to the module where the handler is registered: exported by that module and imported here, or provided by a `@Global()` module like `FirebaseAdminModule`.

> [!IMPORTANT]
> Dependency injection only happens when the handler is passed by class. `PoliciesGuard` resolves `new MinAgePolicyHandler(18)` (an instance) as-is, outside Nest's DI container, so a handler built that way can't also have injected constructor dependencies, the same limitation `new RolesGuard('admin')` has in plain Nest.

### Checks that don't depend on the request

`PolicyContext` doesn't have to be used in full. A policy can enforce a rule that's the same for every caller, like restricting a route to business hours:

```typescript
@Injectable()
export class BusinessHoursPolicyHandler implements PolicyHandler {
  async handle(): Promise<void> {
    const hour = new Date().getUTCHours();
    if (hour < 9 || hour >= 18) {
      throw new Error('This action is only available during business hours (09:00-18:00 UTC)');
    }
  }
}
```

```typescript
@Policies(BusinessHoursPolicyHandler)
@Post('trade')
placeTrade() { ... }
```

### Multi-tenant / organization membership

A handler can compare a claim on the token against a value in the request. This is the case from [Class reference or instance?](#class-reference-or-instance) where the value (`orgId`) only exists once the request arrives, so it's read inside `handle()` rather than passed to a constructor:

```typescript
@Injectable()
export class SameOrganizationPolicyHandler implements PolicyHandler {
  async handle(context: PolicyContext): Promise<void> {
    const claims = context.claims as { orgId?: string };
    const request = context.request as { params: { orgId: string } };

    if (claims?.orgId !== request.params.orgId) {
      throw new Error('You do not belong to this organization');
    }
  }
}
```

```typescript
@Policies(SameOrganizationPolicyHandler)
@Get(':orgId/invoices')
getInvoices(@Param('orgId') orgId: string) { ... }
```

### Policies with parameters

A rule that varies per route, like a minimum age that's 18 on one endpoint and 21 on another, needs the value to travel with the handler, so it has to be an instance instead of a bare class:

```typescript
@Injectable()
export class MinAgePolicyHandler implements PolicyHandler {
  constructor(private readonly minAge: number) {}

  async handle(context: PolicyContext): Promise<void> {
    const claims = context.claims as { birthYear?: number };
    const age = new Date().getFullYear() - (claims?.birthYear ?? 0);

    if (age < this.minAge) {
      throw new Error(`Must be at least ${this.minAge} years old`);
    }
  }
}
```

```typescript
@Policies(new MinAgePolicyHandler(18))
@Get('adult-content')
getAdultContent() { ... }

@Policies(new MinAgePolicyHandler(21))
@Get('alcohol-delivery')
getAlcoholDelivery() { ... }
```

> [!NOTE]
> If a rule only ever needs one fixed value, hardcode it and skip the constructor entirely: `class AdultOnlyPolicyHandler implements PolicyHandler { async handle(context) { /* compares against 18 directly */ } }`, applied as `@Policies(AdultOnlyPolicyHandler)`. Reach for a constructor parameter only when the value genuinely changes per route.

### A parameter and injected services at the same time

`new MinAgePolicyHandler(18)` and dependency injection don't mix: an instance built with `new` is used as-is, so anything else the handler needs (a `UserRepository`, say) never gets resolved. If the check needs both a per-route literal *and* an injected service, use a class factory instead, a plain function that returns a new class, closing over the literal while the class itself stays a real `@Injectable()` Nest can construct through DI:

```typescript
function minAgePolicyHandler(minAge: number): Type<PolicyHandler> {
  @Injectable()
  class MinAgePolicyHandler implements PolicyHandler {
    constructor(private readonly userRepository: UserRepository) {}

    async handle(context: PolicyContext): Promise<void> {
      const user = await this.userRepository.findByUid(context.user.uid);
      if (!user || calculateAge(user.birthDate) < minAge) {
        throw new Error(`Must be at least ${minAge} years old`);
      }
    }
  }

  return MinAgePolicyHandler;
}
```

The factory's return value is a class, not an instance, so it still gets registered in `providers` and passed bare to `@Policies()`: DI resolution and the literal parameter both apply.

```typescript
const MinAgeAdultPolicy = minAgePolicyHandler(18);

@Module({
  providers: [UserRepository, MinAgeAdultPolicy],
})
export class InvoicesModule {}
```

```typescript
@Policies(MinAgeAdultPolicy)
@Get('adult-content')
getAdultContent() { ... }
```

### Composing multiple policies

Every policy passed to `@Policies()` (or `@Auth({ policies })`) must pass; they run concurrently and the first rejection wins. Class references and instances mix freely:

```typescript
@Policies(SameOrganizationPolicyHandler, new MinAgePolicyHandler(18))
@Get(':orgId/invoices/:ownerId')
getInvoice() { ... }
```

### Combining roles and policies

Layer `@Roles()` (what type of user) with `@Policies()` (does this contextual rule hold) on the same route:

```typescript
@Roles('ADMIN')
@Policies(SameOrganizationPolicyHandler)
@Delete(':orgId/users/:userId')
deleteUser() { ... }
```

`@Roles()` already applies `FirebaseGuard`, and `@Policies()` adds `PoliciesGuard` on top; there's no conflict or duplicate work between the two.

See [[Complex Examples|Complex-Examples]] for a version that also adds claims to the mix.

## Handling rejections

A failed policy raises `PolicyViolationException` (`403`), with the same `code`/`message` shape as the rest of the library's auth errors:

```json
{ "statusCode": 403, "code": "FIREBASE_AUTH_POLICY_VIOLATION", "message": "You do not own this resource" }
```

The message on the response is whatever the handler threw (`error.message`, if it threw an `Error`); throwing a plain string or another value, or referencing a class Nest can't resolve, falls back to a generic message. Catch `PolicyViolationException` or check `error.code` against `FirebaseAuthErrorCode.POLICY_VIOLATION` to react to it specifically, same as the other typed exceptions documented in [[Migrations|Migrations]].

## Testing your policy handlers

A handler is a plain class with one method. No registry, no module, no DI setup needed to unit-test it:

```typescript
describe('ResourceOwnerPolicyHandler', () => {
  it('rejects when the caller is not the owner', async () => {
    const handler = new ResourceOwnerPolicyHandler();
    const context = {
      user: { uid: 'user-1' },
      claims: undefined,
      request: { params: { ownerId: 'user-2' } },
    } as PolicyContext;

    await expect(handler.handle(context)).rejects.toThrow('You do not own this resource');
  });
});
```
