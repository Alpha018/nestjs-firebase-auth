import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { DecodedIdToken } from 'firebase-admin/lib/auth';
import { getAuth } from 'firebase-admin/auth';
import { Injectable } from '@nestjs/common';
import * as fa from 'firebase-admin';

import { FirebaseConstructorInterface } from '../interface/firebase-constructor.interface';

@Injectable()
export class FirebaseProvider {
  get auth() {
    return getAuth(this._app);
  }

  get app() {
    return this._app;
  }

  private readonly _app: App;

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

  async getClaimsRoleBase<T>(user: DecodedIdToken, localDecode: boolean): Promise<undefined | T[]> {
    if (localDecode) {
      return user.roles;
    }

    const { customClaims } = await this.auth.getUser(user.uid);
    return customClaims?.roles;
  }

  setClaimsRoleBase<T>(uid: string, claims: T[]): Promise<void> {
    return this.auth.setCustomUserClaims(uid, {
      roles: claims,
    });
  }
}
