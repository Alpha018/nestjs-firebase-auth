import { FIREBASE_POLICIES_DECORATOR } from '../constant/firebase.constant';
import { PolicyHandler } from '../interface/policy-handler.interface';
import { Policies } from './policy.decorator';

class OwnerPolicyHandler implements PolicyHandler {
  constructor(public resourceId: string) {}

  async handle(): Promise<void> {}
}

class BusinessHoursPolicyHandler implements PolicyHandler {
  async handle(): Promise<void> {}
}

describe('Policies', () => {
  it('should set the policies metadata on the handler', () => {
    const policies = [new OwnerPolicyHandler('resource-1')];
    const decorator = Policies(...policies);

    function testFunction() {}
    decorator(testFunction);

    const metadata = Reflect.getMetadata(FIREBASE_POLICIES_DECORATOR, testFunction);
    expect(metadata).toEqual(policies);
  });

  it('should accept a bare class reference alongside instances', () => {
    const decorator = Policies(BusinessHoursPolicyHandler, new OwnerPolicyHandler('resource-1'));

    function testFunction() {}
    decorator(testFunction);

    const metadata = Reflect.getMetadata(FIREBASE_POLICIES_DECORATOR, testFunction);
    expect(metadata).toEqual([BusinessHoursPolicyHandler, new OwnerPolicyHandler('resource-1')]);
  });

  it('should set an empty array when called without policies', () => {
    const decorator = Policies();

    function testFunction() {}
    decorator(testFunction);

    const metadata = Reflect.getMetadata(FIREBASE_POLICIES_DECORATOR, testFunction);
    expect(metadata).toEqual([]);
  });
});
