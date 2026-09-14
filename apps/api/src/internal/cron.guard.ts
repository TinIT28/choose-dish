import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AppConfig } from '../config/app-config';

@Injectable()
export class CronGuard implements CanActivate {
  constructor(private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const expected = this.config.cronSecret;
    if (!expected || request.header('authorization') !== `Bearer ${expected}`) {
      throw new UnauthorizedException('Cron secret không hợp lệ');
    }
    return true;
  }
}
