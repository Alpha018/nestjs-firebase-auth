import { FIREBASE_APP_ROLES_DECORATOR } from '../constant/firebase.constant';
import { RolesGuard } from './role.decorator';

describe('RolesGuard', () => {
  it('should set metadata with roles', () => {
    const roles = ['admin', 'user'];
    const decorator = RolesGuard(...roles);

    function testFunction() {}

    decorator(testFunction);

    const metadata = Reflect.getMetadata(FIREBASE_APP_ROLES_DECORATOR, testFunction);
    expect(metadata).toEqual(roles);
  });

  it('should handle no roles', () => {
    const decorator = RolesGuard();

    function testFunction() {}

    decorator(testFunction);

    const metadata = Reflect.getMetadata(FIREBASE_APP_ROLES_DECORATOR, testFunction);
    expect(metadata).toEqual([]);
  });
});
