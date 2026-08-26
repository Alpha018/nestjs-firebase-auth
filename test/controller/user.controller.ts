import { Controller, HttpCode, Query, Body, Post, Get } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';
import { DecodedIdToken } from 'firebase-admin/auth';

import { UnregisteredPolicyHandler, SelfOwnedPolicyHandler } from './self-owned.policy';
import { FirebaseRolesClaims, FirebaseProvider, Policies, Roles } from '../../src';
import { FirebaseUser, Auth } from '../../src';

export enum AppRole {
  ADMIN,
  USER,
}

@Controller('users')
export class UsersController {
  constructor(private readonly firebaseProvider: FirebaseProvider) { }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { uid: string }) {
    let token: string;

    if (body.uid) {
      token = await this.firebaseProvider.auth.createCustomToken(body.uid);
    } else {
      throw new Error('Invalid login credentials');
    }

    return { accessToken: token };
  }

  @Post('firestore/write')
  @HttpCode(200)
  async firestoreWrite(@Body() body: { collection: string; docId: string; data: any }) {
    const firestore = getFirestore(this.firebaseProvider.app);
    await firestore.collection(body.collection).doc(body.docId).set(body.data);
    return { status: 'ok' };
  }

  @Get('firestore/read')
  async firestoreRead(@Query('collection') collection: string, @Query('docId') docId: string) {
    const firestore = getFirestore(this.firebaseProvider.app);
    const doc = await firestore.collection(collection).doc(docId).get();
    return doc.data();
  }

  @Post('set-role-claims')
  @HttpCode(200)
  async setRoleClaims(@Body() body: { claim: AppRole; uid: string; }) {
    await this.firebaseProvider.setClaimsRoleBase<AppRole>(body.uid, [body.claim]);
    return { status: 'ok' };
  }

  @Post('set-claims')
  @HttpCode(200)
  async setClaims(@Body() body: { claim: Record<string, any>; uid: string; }) {
    await this.firebaseProvider.setClaimsBase(body.uid, body.claim);
    return { status: 'ok' };
  }

  @Get('app-info')
  getAppInfo() {
    return {
      options: this.firebaseProvider.app.options,
      name: this.firebaseProvider.app.name,
    };
  }

  @Policies(SelfOwnedPolicyHandler)
  @Get('policy/self-owned')
  getSelfOwnedPolicy(@FirebaseUser() user: DecodedIdToken) {
    return user;
  }

  @Get('get-role-claims')
  @Roles(AppRole.ADMIN)
  async getRoleClaims(@FirebaseRolesClaims() claims: AppRole[]) {
    return claims;
  }

  @Policies(UnregisteredPolicyHandler)
  @Get('policy/unregistered')
  getUnregisteredPolicy() {
    return { status: 'ok' };
  }

  @Roles(AppRole.ADMIN)
  @Get('get-claims')
  async getClaims(@FirebaseUser() user: unknown) {
    return user;
  }

  @Get('me')
  @Auth()
  getMe(@FirebaseUser() user: DecodedIdToken) {
    return user;
  }
}
