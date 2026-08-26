import { FIREBASE_APP_ROLES_DECORATOR } from '../constant/firebase.constant';
import { Roles } from './role.decorator';

describe('Roles', () => {
  it('should set metadata with roles', () => {
    const roles = ['admin', 'user'];
    const decorator = Roles(...roles);

    function testFunction() {}

    decorator(testFunction);

    const metadata = Reflect.getMetadata(FIREBASE_APP_ROLES_DECORATOR, testFunction);
    expect(metadata).toEqual(roles);
  });

  it('should handle no roles', () => {
    const decorator = Roles();

    function testFunction() {}

    decorator(testFunction);

    const metadata = Reflect.getMetadata(FIREBASE_APP_ROLES_DECORATOR, testFunction);
    expect(metadata).toEqual([]);
  });
});
