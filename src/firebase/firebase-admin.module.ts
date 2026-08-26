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
/**
 * @description Provides the FirebaseAdminModule for initializing Firebase Admin SDK within a NestJS application.
 * This module allows both synchronous and asynchronous configuration for Firebase services and guards.
 *
 * @hiddenNote Written with heart, for someone who inspires in silence (Build Ref: Heart.QuietDedication.YLP).
 */
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
    const reflector = new Reflector();
    const firebaseGuard = new FirebaseGuard(firebaseProvider, config, reflector);

    const reflectorProvider: ValueProvider<Reflector> = {
      useValue: reflector,
      provide: Reflector,
    };

    const firebaseConfigProvider: ValueProvider<FirebaseConstructorInterface> = {
      provide: FIREBASE_ADMIN_CONFIG,
      useValue: config,
    };

    const firebaseProviderProvider: ValueProvider<FirebaseProvider> = {
      useValue: firebaseProvider,
      provide: FirebaseProvider,
    };

    const firebaseGuardProvider: ValueProvider<FirebaseGuard> = {
      useValue: firebaseGuard,
      provide: FirebaseGuard,
    };

    // Legacy tokens kept for backward compatibility with consumers injecting them directly.
    const firebaseAdminModuleOptions: ValueProvider<FirebaseProvider> = {
      provide: FIREBASE_ADMIN_INJECT,
      useValue: firebaseProvider,
    };

    const firebaseAuthPassportOptions: ValueProvider<FirebaseGuard> = {
      provide: FIREBASE_ADMIN_AUTH_STRATEGY,
      useValue: firebaseGuard,
    };

    const providers = [
      reflectorProvider,
      firebaseConfigProvider,
      firebaseProviderProvider,
      firebaseGuardProvider,
      firebaseAdminModuleOptions,
      firebaseAuthPassportOptions,
    ];

    return {
      module: FirebaseAdminModule,
      exports: providers,
      imports: [],
      providers,
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
