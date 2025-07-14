import { FactoryProvider, DynamicModule, ValueProvider, Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  FIREBASE_ADMIN_MODULE_OPTIONS,
  FIREBASE_ADMIN_AUTH_STRATEGY,
  FIREBASE_ADMIN_CONFIG,
  FIREBASE_ADMIN_INJECT,
} from './constant/firebase.constant';
import { FirebaseConstructorInterface } from './interface/firebase-constructor.interface';
import { FirebaseAdminModuleAsyncOptions } from './interface/firebase-admin.interface';
import { FirebaseProvider } from './provider/firebase.provider';
import { FirebaseGuard } from './guard/firebase.guard';

@Module({})
@Global()
export class FirebaseAdminModule {
  static forRootAsync(options: FirebaseAdminModuleAsyncOptions): DynamicModule {
    const firebaseAdminModuleOptions: FactoryProvider<FirebaseProvider> = {
      useFactory: (config: FirebaseConstructorInterface) => new FirebaseProvider(config),
      inject: [FIREBASE_ADMIN_MODULE_OPTIONS],
      provide: FirebaseProvider,
    };

    const reflectorProvider: FactoryProvider<Reflector> = {
      useFactory: () => new Reflector(),
      provide: Reflector,
    };

    const firebaseOptions: FactoryProvider<FirebaseConstructorInterface> = {
      useFactory: (config: FirebaseConstructorInterface) => config,
      inject: [FIREBASE_ADMIN_MODULE_OPTIONS],
      provide: FIREBASE_ADMIN_CONFIG,
    };

    const firebaseAuthPassportOptions: FactoryProvider<FirebaseGuard> = {
      useFactory: (
        firebaseProvider: FirebaseProvider,
        config: FirebaseConstructorInterface,
        reflector: Reflector,
      ) => {
        return new FirebaseGuard(firebaseProvider, config, reflector);
      },
      inject: [FirebaseProvider, FIREBASE_ADMIN_MODULE_OPTIONS, Reflector],
      provide: FirebaseGuard,
    };

    const asyncProviders = this.createAsyncProviders(options);

    return {
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
      imports: [...(options.imports || [])],
      module: FirebaseAdminModule,
    };
  }

  static forRoot(config: FirebaseConstructorInterface): DynamicModule {
    const firebaseProvider = new FirebaseProvider(config);

    const firebaseAdminModuleOptions: ValueProvider<FirebaseProvider> = {
      provide: FIREBASE_ADMIN_INJECT,
      useValue: firebaseProvider,
    };

    const reflectorProvider: ValueProvider<Reflector> = {
      useValue: new Reflector(),
      provide: Reflector,
    };

    const firebaseAuthPassportOptions: ValueProvider<FirebaseGuard> = {
      useValue: new FirebaseGuard(firebaseProvider, config, new Reflector()),
      provide: FIREBASE_ADMIN_AUTH_STRATEGY,
    };

    return {
      providers: [reflectorProvider, firebaseAdminModuleOptions, firebaseAuthPassportOptions],
      exports: [reflectorProvider, firebaseAdminModuleOptions, firebaseAuthPassportOptions],
      module: FirebaseAdminModule,
      imports: [],
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
