import { FirebaseGuard } from '../guard/firebase.guard';
import { Auth } from './auth.decorator';

jest.mock('@nestjs/common', () => {
  const originalModule = jest.requireActual('@nestjs/common');
  return {
    ...originalModule,
    applyDecorators: jest.fn(),
    UseGuards: jest.fn(),
  };
});

import { applyDecorators, UseGuards } from '@nestjs/common';

describe('AuthDecorator', () => {
  it('should apply guards correctly', () => {
    Auth();
    expect(UseGuards).toHaveBeenCalledWith(FirebaseGuard);
    expect(applyDecorators).toHaveBeenCalled();
  });
});
