import { TestingModule, Test } from '@nestjs/testing';
import { ModuleRef, Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

import { FIREBASE_TOKEN_USER_METADATA } from '../constant/firebase.constant';
import { PolicyViolationException } from '../error/firebase-auth.exception';
import { PolicyHandler } from '../interface/policy-handler.interface';
import { PoliciesGuard } from './policy.guard';

class OwnerPolicyHandler implements PolicyHandler {
  async handle(): Promise<void> {}
}

class ReflectorMock {
  getAllAndOverride = jest.fn();
}

class ModuleRefMock {
  get = jest.fn();
}

describe('PoliciesGuard', () => {
  let guard: PoliciesGuard;
  let reflector: ReflectorMock;
  let moduleRef: ModuleRefMock;
  let context: ExecutionContext;
  let request: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesGuard,
        { useClass: ReflectorMock, provide: Reflector },
        { useClass: ModuleRefMock, provide: ModuleRef },
      ],
    }).compile();

    guard = module.get(PoliciesGuard);
    reflector = module.get(Reflector);
    moduleRef = module.get(ModuleRef);

    request = {
      metadata: {
        [FIREBASE_TOKEN_USER_METADATA]: { user: { uid: 'user-1' } },
      },
    };
    context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  });

  it('should return true if no policies are required', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should return true when an instance handler resolves', async () => {
    const handler: PolicyHandler = { handle: jest.fn().mockResolvedValue(undefined) };
    reflector.getAllAndOverride.mockReturnValue([handler]);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(handler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ user: { uid: 'user-1' }, request }),
    );
    expect(moduleRef.get).not.toHaveBeenCalled();
  });

  it('should resolve a bare class reference through the DI container', async () => {
    const handler: PolicyHandler = { handle: jest.fn().mockResolvedValue(undefined) };
    moduleRef.get.mockReturnValue(handler);
    reflector.getAllAndOverride.mockReturnValue([OwnerPolicyHandler]);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(moduleRef.get).toHaveBeenCalledWith(OwnerPolicyHandler, { strict: false });
    expect(handler.handle).toHaveBeenCalled();
  });

  it('should throw PolicyViolationException when a policy handler rejects', async () => {
    const handler: PolicyHandler = {
      handle: jest.fn().mockRejectedValue(new Error('not the owner')),
    };
    reflector.getAllAndOverride.mockReturnValue([handler]);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(PolicyViolationException);
  });

  it('should throw PolicyViolationException when the DI container has no provider for the class', async () => {
    moduleRef.get.mockImplementation(() => {
      throw new Error('OwnerPolicyHandler is not registered in the current context');
    });
    reflector.getAllAndOverride.mockReturnValue([OwnerPolicyHandler]);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(PolicyViolationException);
  });

  it('should return true and never touch the DI container when the policy list is empty', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(moduleRef.get).not.toHaveBeenCalled();
  });

  it('should return true only after every policy handler resolves', async () => {
    const firstHandler: PolicyHandler = { handle: jest.fn().mockResolvedValue(undefined) };
    const secondHandler: PolicyHandler = { handle: jest.fn().mockResolvedValue(undefined) };
    reflector.getAllAndOverride.mockReturnValue([firstHandler, secondHandler]);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(firstHandler.handle).toHaveBeenCalled();
    expect(secondHandler.handle).toHaveBeenCalled();
  });

  it('should throw PolicyViolationException if any policy among several rejects', async () => {
    const passingHandler: PolicyHandler = { handle: jest.fn().mockResolvedValue(undefined) };
    const failingHandler: PolicyHandler = {
      handle: jest.fn().mockRejectedValue(new Error('denied')),
    };
    reflector.getAllAndOverride.mockReturnValue([passingHandler, failingHandler]);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(PolicyViolationException);
  });

  it('should fall back to the default message when a non-Error value is thrown', async () => {
    const handler: PolicyHandler = { handle: jest.fn().mockRejectedValue('denied') };
    reflector.getAllAndOverride.mockReturnValue([handler]);

    const error = await guard.canActivate(context).catch((e) => e);
    expect(error).toBeInstanceOf(PolicyViolationException);
    expect(error.getResponse()).toMatchObject({
      message: 'The authenticated user does not satisfy the required policy',
    });
  });

  it('should propagate the handler error message', async () => {
    const handler: PolicyHandler = {
      handle: jest.fn().mockRejectedValue(new Error('user is not the resource owner')),
    };
    reflector.getAllAndOverride.mockReturnValue([handler]);

    const error = await guard.canActivate(context).catch((e) => e);
    expect(error.getResponse()).toMatchObject({ message: 'user is not the resource owner' });
    expect(error.getStatus()).toBe(403);
  });
});
