import { Type } from '@nestjs/common';

import { PolicyHandler } from './policy-handler.interface';

/**
 * Either an already-built `PolicyHandler` instance or a bare class reference,
 * same as `@UseGuards()`. A bare class is resolved through Nest's DI container
 * (so it can inject services); an instance is used as-is, for a handler that
 * needs a literal parameter DI can't provide (e.g. `new MinAgePolicyHandler(18)`).
 */
export type PolicyReference = Type<PolicyHandler> | PolicyHandler;
