import { DynamicModule, FactoryProvider, Global, Module, ValueProvider } from '@nestjs/common';
import { FirebaseGuard } from './guard/firebase.guard';
import { FirebaseProvider } from './provider/firebase.provider';
import { FirebaseConstructorInterface } from './interface/firebase-constructor.interface';
import { FirebaseAdminModuleAsyncOptions } from './interface/firebase-admin.interface';
import {
  FIREBASE_ADMIN_AUTH_STRATEGY,
  FIREBASE_ADMIN_CONFIG,
  FIREBASE_ADMIN_INJECT,
  FIREBASE_ADMIN_MODULE_OPTIONS,
} from './constant/firebase.constant';
import { Reflector } from '@nestjs/core';

@Global()
@Module({})
export class FirebaseAdminModule {
  static forRoot(config: FirebaseConstructorInterface): DynamicModule {
    const firebaseProvider = new FirebaseProvider(config);

    const firebaseAdminModuleOptions: ValueProvider<FirebaseProvider> = {
      provide: FIREBASE_ADMIN_INJECT,
      useValue: firebaseProvider,
    };

    const reflectorProvider: ValueProvider<Reflector> = {
      provide: Reflector,
      useValue: new Reflector(),
    };

    const firebaseAuthPassportOptions: ValueProvider<FirebaseGuard> = {
      provide: FIREBASE_ADMIN_AUTH_STRATEGY,
      useValue: new FirebaseGuard(firebaseProvider, config, new Reflector()),
    };

    return {
      imports: [],
      module: FirebaseAdminModule,
      providers: [reflectorProvider, firebaseAdminModuleOptions, firebaseAuthPassportOptions],
      exports: [reflectorProvider, firebaseAdminModuleOptions, firebaseAuthPassportOptions],
    };
  }

  static forRootAsync(options: FirebaseAdminModuleAsyncOptions): DynamicModule {
    const firebaseAdminModuleOptions: FactoryProvider<FirebaseProvider> = {
      provide: FirebaseProvider,
      useFactory: (config: FirebaseConstructorInterface) => new FirebaseProvider(config),
      inject: [FIREBASE_ADMIN_MODULE_OPTIONS],
    };

    const reflectorProvider: FactoryProvider<Reflector> = {
      provide: Reflector,
      useFactory: () => new Reflector(),
    };

    const firebaseOptions: FactoryProvider<FirebaseConstructorInterface> = {
      provide: FIREBASE_ADMIN_CONFIG,
      useFactory: (config: FirebaseConstructorInterface) => config,
      inject: [FIREBASE_ADMIN_MODULE_OPTIONS],
    };

    const firebaseAuthPassportOptions: FactoryProvider<FirebaseGuard> = {
      provide: FirebaseGuard,
      useFactory: (
        firebaseProvider: FirebaseProvider,
        config: FirebaseConstructorInterface,
        reflector: Reflector,
      ) => {
        console.log(reflector);
        return new FirebaseGuard(firebaseProvider, config, reflector);
      },
      inject: [FirebaseProvider, FIREBASE_ADMIN_MODULE_OPTIONS, Reflector],
    };

    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: FirebaseAdminModule,
      imports: [...(options.imports || [])],
      providers: [
        ...asyncProviders,
        reflectorProvider,
        firebaseAdminModuleOptions,
        firebaseOptions,
        firebaseAuthPassportOptions,
      ],
      exports: [
        reflectorProvider,
        firebaseAdminModuleOptions,
        firebaseOptions,
        firebaseAuthPassportOptions,
      ],
    };
  }

  private static createAsyncProviders(options: FirebaseAdminModuleAsyncOptions): any[] {
    if (options.useFactory) {
      return [
        {
          provide: FIREBASE_ADMIN_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    return [];
  }
}
