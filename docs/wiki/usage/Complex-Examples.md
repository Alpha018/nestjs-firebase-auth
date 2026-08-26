# Complex Examples

This page collects realistic examples that combine more than one authorization mechanism at once. Each mechanism has its own page documenting it in isolation: [[Policies (ABAC)|Authorization-Policies]] and [[Claims (Fine-Grained)|Authorization-Claims]].

## Roles, claims, and policies on one route

All three mechanisms compose on the same route through `@Auth({ roles, claims, policies })`, each layer narrowing what the previous one allowed:

```typescript
@Auth({
  roles: ['EDITOR'],
  claims: [UsersClaim.WRITE, InvoicesClaim.ISSUE],
  policies: [SameOrganizationPolicyHandler],
})
@Patch(':orgId/users/:userId')
updateUser() { ... }
```

- `roles` narrows by category: the user must be an `EDITOR` (or hold any other listed role).
- `claims` requires specific fine-grained actions: the user must hold *both* `users:write` and `invoices:issue`.
- `policies` adds a contextual, runtime check: the user must belong to the same organization as `:orgId`.

`@Auth()` applies `FirebaseGuard` once and adds `ClaimsGuard`/`PoliciesGuard` only for the options actually passed, so there's no duplicate token verification between the three.

## Controller-level roles, narrowed per endpoint

[[Basic Usage|Basic-Usage]] shows applying `@Auth()` at the controller level and `@Roles()` per endpoint. The same pattern extends to all three mechanisms: broad access at the controller, progressively tighter checks on individual routes.

```typescript
import { Auth, Roles, RequireClaims, Policies } from '@alpha018/nestjs-firebase-auth';

enum InvoicesClaim {
  ISSUE = 'invoices:issue',
  VOID = 'invoices:void',
}

@Roles('EDITOR', 'ADMIN') // Applies to every route in this controller
@Controller('invoices')
export class InvoicesController {

  @Get(':id')
  getInvoice(@Param('id') id: string) {
    // Accessible by any EDITOR or ADMIN
    return { status: 'ok' };
  }

  @RequireClaims(InvoicesClaim.ISSUE) // Narrows further: EDITOR/ADMIN who also hold this claim
  @Post()
  issueInvoice() {
    return { status: 'issued' };
  }

  @RequireClaims(InvoicesClaim.VOID)
  @Policies(SameOrganizationPolicyHandler) // Plus a contextual check on top of role and claim
  @Delete(':orgId/:id')
  voidInvoice(@Param('id') id: string) {
    return { status: 'voided' };
  }
}
```

`@Roles()` at the controller level already applies `FirebaseGuard`, so the method-level `@RequireClaims()` and `@Policies()` decorators only add `ClaimsGuard`/`PoliciesGuard` on top, without re-verifying the token.

> [!NOTE]
> This mirrors the "apply broadly, narrow per endpoint" pattern from [[Basic Usage|Basic-Usage]]'s controller-level authentication section, extended to claims and policies rather than roles alone.

> [!IMPORTANT]
> `@Roles()`, `@RequireClaims()`, and `@Policies()` each apply `FirebaseGuard` on their own when used standalone. Stacking them on the same route (as above) is fine since each one only adds its own extra guard (`ClaimsGuard`, `PoliciesGuard`); the redundant case to avoid is pairing a decorator with `@Auth({ ... })` covering that same option on the same route, which registers that guard twice for no benefit. See [[Claims (Fine-Grained)|Authorization-Claims]] and [[Policies (ABAC)|Authorization-Policies]] for details.
