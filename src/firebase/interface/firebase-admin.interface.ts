import { ModuleMetadata } from '@nestjs/common';
import { FirebaseConstructorInterface } from './firebase-constructor.interface';

export interface FirebaseAdminModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  useFactory?: (
    ...args: any[]
  ) => Promise<FirebaseConstructorInterface> | FirebaseConstructorInterface;
  inject?: any[];
}
