import { Controller, UseGuards, HttpCode, Body, Post, Get } from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/lib/auth';

import { FirebaseUserClaims, FirebaseProvider, RolesGuard } from '../../src';
import { FirebaseGuard } from '../../src';
import { FirebaseUser } from '../../src';

export enum Roles {
  ADMIN,
  USER,
}

@Controller('users')
export class UsersController {
  constructor(private readonly firebaseProvider: FirebaseProvider) {}

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

  @Post('set-claims')
  @HttpCode(200)
  async setClaims(@Body() body: { claim: Roles; uid: string; }) {
    await this.firebaseProvider.setClaimsRoleBase<Roles>(body.uid, [body.claim]);
    return { status: 'ok' };
  }

  @UseGuards(FirebaseGuard)
  @RolesGuard(Roles.ADMIN)
  @Get('get-claims')
  async getClaims(@FirebaseUserClaims() claims: Roles[]) {
    return claims;
  }

  @UseGuards(FirebaseGuard)
  @Get('me')
  getMe(@FirebaseUser() user: DecodedIdToken) {
    return user;
  }
}
