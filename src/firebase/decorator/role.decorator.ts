import { SetMetadata } from '@nestjs/common';
import { FIREBASE_APP_ROLES_DECORATOR } from '../constant/firebase.constant';

export const RolesGuard = <T>(...roles: T[]) => SetMetadata(FIREBASE_APP_ROLES_DECORATOR, roles);
