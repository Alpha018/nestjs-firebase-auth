import * as admin from 'firebase-admin';

import { FirebaseAuthStrategyOptions } from './options.interface';

/**
 * Interface representing the configuration object required to initialize the Firebase Admin SDK.
 * This can be provided using service account credentials, either as an `AppOptions` object or as a base64-encoded string.
 */
export interface FirebaseConstructorInterface {
  auth?: {
    config: FirebaseAuthStrategyOptions;
  };
  options?: admin.AppOptions;
  base64?: string;
}
