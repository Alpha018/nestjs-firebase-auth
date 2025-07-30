import { ModuleMetadata } from '@nestjs/common';

import { FirebaseConstructorInterface } from './firebase-constructor.interface';

/**
 * Interface representing the options for asynchronously configuring the FirebaseAdminModule.
 * This allows the module to be initialized dynamically using a factory function or provider pattern.
 */
export interface FirebaseAdminModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (
    ...args: any[]
  ) => Promise<FirebaseConstructorInterface> | FirebaseConstructorInterface;
  inject?: any[];
  name?: string;
}
