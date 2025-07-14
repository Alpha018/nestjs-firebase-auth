import * as admin from 'firebase-admin';

import { FirebaseAuthStrategyOptions } from './options.interface';

export interface FirebaseConstructorInterface {
  auth?: {
    config: FirebaseAuthStrategyOptions;
  };
  options?: admin.AppOptions;
  base64?: string;
}
