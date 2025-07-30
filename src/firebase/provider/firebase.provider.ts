import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { DecodedIdToken } from 'firebase-admin/lib/auth';
import { getAuth } from 'firebase-admin/auth';
import { Injectable } from '@nestjs/common';
import * as fa from 'firebase-admin';

import { FirebaseConstructorInterface } from '../interface/firebase-constructor.interface';

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

  /**
   * Creates an instance of FirebaseProvider.
   * Initializes Firebase using base64 credentials or an options object.
   * @param data Configuration object containing Firebase credentials (base64-encoded) or options.
   */
  constructor(private readonly data: FirebaseConstructorInterface) {
    if (data.base64) {
      this._app = initializeApp({
        credential: fa.credential.cert(
          JSON.parse(Buffer.from(data.base64, 'base64').toString('utf-8')),
        ),
      });
    } else if (data.options) {
      this._app = initializeApp(this.data.options);
    }
    this._app = getApps().length > 0 ? getApp() : initializeApp();
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
      return user.roles;
    }

    const { customClaims } = await this.auth.getUser(user.uid);
    return customClaims?.roles;
  }

  /**
   * Sets role-based claims for a specific Firebase user.
   * This overwrites the user's custom claims with a new `roles` array.
   *
   * @template T The type of roles being assigned.
   * @param uid The UID of the user to update.
   * @param claims An array of roles to assign to the user.
   * @returns A promise that resolves once the claims are successfully updated.
   */
  setClaimsRoleBase<T>(uid: string, claims: T[]): Promise<void> {
    return this.auth.setCustomUserClaims(uid, {
      roles: claims,
    });
  }
}
