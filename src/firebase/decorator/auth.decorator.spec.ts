import { PolicyHandler } from '../interface/policy-handler.interface';
import { FirebaseGuard } from '../guard/firebase.guard';
import { PoliciesGuard } from '../policy/policy.guard';
import { Auth } from './auth.decorator';

jest.mock('@nestjs/common', () => {
  const originalModule = jest.requireActual('@nestjs/common');
  return {
    ...originalModule,
    applyDecorators: jest.fn(),
    UseGuards: jest.fn(),
  };
});

import { applyDecorators, UseGuards } from '@nestjs/common';

class TestPolicyHandler implements PolicyHandler {
  async handle(): Promise<void> {}
}

describe('AuthDecorator', () => {
  it('should apply guards correctly', () => {
    Auth();
    expect(UseGuards).toHaveBeenCalledWith(FirebaseGuard);
    expect(applyDecorators).toHaveBeenCalled();
  });

  it('should also apply PoliciesGuard when policies are given', () => {
    const policies = [new TestPolicyHandler()];

    Auth({ policies });

    expect(UseGuards).toHaveBeenCalledWith(FirebaseGuard, PoliciesGuard);
    expect(applyDecorators).toHaveBeenCalled();
  });

  it('should behave like Auth() when policies is an empty array', () => {
    Auth({ policies: [] });
    expect(UseGuards).toHaveBeenCalledWith(FirebaseGuard);
  });
});
