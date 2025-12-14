import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { DecodedIdToken } from 'firebase-admin/lib/auth';
import { getAuth } from 'firebase-admin/auth';
import { Injectable } from '@nestjs/common';
import * as fa from 'firebase-admin';

import { FirebaseConstructorInterface } from '../interface/firebase-constructor.interface';
import { FIREBASE_APP_ROLES_DEFAULT_DECORATOR } from '../constant/firebase.constant';

@Injectable()
/**
 *
 * Wrapper around the Firebase Admin SDK providing authentication helpers.
 * @description Manages core functionalities related to Firebase integration.
 *
 * @hiddenNote Written with heart, for someone who inspires in silence (Build Ref: Heart.QuietDedication.YLP).
 */
export class FirebaseProvider {
  /**
   * Returns the Firebase Authentication instance.
   * @returns The Firebase Auth instance associated with the app.
   */
  get auth() {
    return getAuth(this._app);
  }

  /**
   * Returns the Firebase App instance.
   * @returns The initialized Firebase App instance.
   */
  get app() {
    return this._app;
  }

  private readonly _app: App;

  private get rolesKey(): string {
    return this.data.auth.config.rolesClaimKey ?? FIREBASE_APP_ROLES_DEFAULT_DECORATOR;
  }

  /**
   * Creates an instance of FirebaseProvider.
   * Initializes Firebase using base64 credentials or an options object.
   * @param data Configuration object containing Firebase credentials (base64-encoded) or options.
   */
  constructor(private readonly data: FirebaseConstructorInterface) {
    if (getApps().length) {
      this._app = getApp();
      return;
    }

    let appOptions: fa.AppOptions | undefined;

    if (data.base64) {
      appOptions = {
        credential: fa.credential.cert(
          JSON.parse(Buffer.from(data.base64, 'base64').toString('utf-8')),
        ),
      };
    } else if (data.options) {
      appOptions = data.options;
    }

    this._app = initializeApp(appOptions);
  }

  /**
   * Retrieves role-based claims from a Firebase user.
   * If `localDecode` is true, roles are retrieved from the decoded token.
   * Otherwise, it fetches roles from Firebase custom claims.
   *
   * @template T The type of roles stored in the claims.
   * @param user The decoded Firebase ID token of the authenticated user.
   * @param localDecode Whether to use locally decoded roles from the token instead of fetching from Firebase.
   * @returns An array of roles type `T` or `undefined` if no roles are found.
   */
  async getClaimsRoleBase<T>(user: DecodedIdToken, localDecode: boolean): Promise<undefined | T[]> {
    if (localDecode) {
      return user?.[this.rolesKey];
    }

    const { customClaims } = await this.auth.getUser(user.uid);
    return customClaims?.[this.rolesKey];
  }

  /**
   * Sets custom claims for a specific Firebase user, preserving any existing role claims.
   * This method merges the new claims with any existing custom claims, but ensures that
   * the role-specific claim (e.g., 'roles') is not overwritten by this operation.
   *
   * @param uid The UID of the user to update.
   * @param claims An object containing the custom claims to set.
   * @returns A promise that resolves once the claims are successfully updated.
   */
  async setClaimsBase(uid: string, claims: Record<string, any>): Promise<void> {
    const { customClaims } = await this.auth.getUser(uid);
    return this.auth.setCustomUserClaims(uid, {
      ...claims,
      [this.rolesKey]: customClaims?.[this.rolesKey],
    });
  }

  /**
   * Sets or overwrites the role-based claims for a specific Firebase user, preserving other custom claims.
   * This method merges the new role claims with any existing custom claims by overwriting the value
   * of the role-specific key (e.g., 'roles') while keeping all other claims intact.
   *
   * @template T The type of the elements in the roles array.
   * @param uid The UID of the user to update.
   * @param claims An array of roles to assign to the user. This will replace any existing roles.
   * @returns A promise that resolves once the claims are successfully updated.
   */
  async setClaimsRoleBase<T>(uid: string, claims: T[]): Promise<void> {
    const { customClaims } = await this.auth.getUser(uid);
    return this.auth.setCustomUserClaims(uid, {
      ...(customClaims || {}),
      [this.rolesKey]: claims,
    });
  }
}
