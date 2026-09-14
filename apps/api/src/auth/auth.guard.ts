import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { PublicUser } from './auth.types';

export interface AuthenticatedRequest extends Request {
  user: PublicUser;
}

export const SIGN_IN_REQUIRED = 'Yêu cầu đăng nhập';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header('authorization');
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException(SIGN_IN_REQUIRED);
    }

    request.user = await this.authService.verifyAccessToken(token);
    return true;
  }
}
