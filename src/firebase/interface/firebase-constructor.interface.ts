import * as admin from 'firebase-admin';
import { FirebaseAuthStrategyOptions } from './options.interface';

export interface FirebaseConstructorInterface {
  base64?: string;
  options?: admin.AppOptions;
  auth?: {
    config: FirebaseAuthStrategyOptions;
  };
}
