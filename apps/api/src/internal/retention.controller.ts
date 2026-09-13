import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { RetentionService } from './retention.service';

@Controller('internal/retention')
export class RetentionController {
  constructor(private readonly retentionService: RetentionService) {}

  @Get()
  cleanup(@Req() request: Request) {
    const expected = process.env.CRON_SECRET;
    const authorization = request.header('authorization');
    if (!expected || authorization !== `Bearer ${expected}`) {
      throw new UnauthorizedException('Cron secret không hợp lệ');
    }
    return this.retentionService.cleanup();
  }
}
