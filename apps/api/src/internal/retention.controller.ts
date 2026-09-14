import { Controller, Get, UseGuards } from '@nestjs/common';
import { CronGuard } from './cron.guard';
import { RetentionService } from './retention.service';

@UseGuards(CronGuard)
@Controller('internal/retention')
export class RetentionController {
  constructor(private readonly retentionService: RetentionService) {}

  @Get()
  cleanup() {
    return this.retentionService.cleanup();
  }
}
