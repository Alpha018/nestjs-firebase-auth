import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { FirebaseProvider, FirebaseUserClaims, RolesGuard } from '../../src';
import { FirebaseGuard } from '../../src';
import { FirebaseUser } from '../../src';
import { DecodedIdToken } from 'firebase-admin/lib/auth';

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

  @UseGuards(FirebaseGuard)
  @Get('me')
  getMe(@FirebaseUser() user: DecodedIdToken) {
    return user;
  }

  @Post('set-claims')
  @HttpCode(200)
  async setClaims(@Body() body: { uid: string; claim: Roles }) {
    await this.firebaseProvider.setClaimsRoleBase<Roles>(body.uid, [body.claim]);
    return { status: 'ok' };
  }

  @RolesGuard(Roles.ADMIN)
  @UseGuards(FirebaseGuard)
  @Get('get-claims')
  async getClaims(@FirebaseUserClaims() claims: Roles[]) {
    return { ...claims };
  }
}
