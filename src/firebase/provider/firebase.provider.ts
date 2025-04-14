import { Injectable } from '@nestjs/common';
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { FirebaseConstructorInterface } from '../interface/firebase-constructor.interface';
import { getAuth } from 'firebase-admin/auth';
import * as fa from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/lib/auth';

@Injectable()
export class FirebaseProvider {
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

  get app() {
    return this._app;
  }

  get auth() {
    return getAuth(this._app);
  }

  setClaimsRoleBase<T>(uid: string, claims: T[]): Promise<void> {
    return this.auth.setCustomUserClaims(uid, {
      roles: claims,
    });
  }

  async getClaimsRoleBase<T>(user: DecodedIdToken, localDecode: boolean): Promise<T[] | undefined> {
    if (localDecode) {
      return user.roles;
    }

    const { customClaims } = await this.auth.getUser(user.uid);
    return customClaims?.roles;
  }
}
