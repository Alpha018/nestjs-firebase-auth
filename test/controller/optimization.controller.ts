import { Controller, HttpCode, Get } from '@nestjs/common';

import { Roles, Auth } from '../../src';

export enum OptimizationRoles {
  ADMIN,
  USER,
}

@Controller('optimization')
@Auth()
export class OptimizationController {

  @Roles(OptimizationRoles.ADMIN)
  @Get('double-guard')
  @HttpCode(200)
  testDoubleGuard() {
    return { status: 'ok' };
  }
}
