import { Module } from '@nestjs/common';
import { SelectionCalendarModule } from '../selections/selection-calendar.module';
import { CronGuard } from './cron.guard';
import { RetentionController } from './retention.controller';
import { RetentionService } from './retention.service';

@Module({
  imports: [SelectionCalendarModule],
  controllers: [RetentionController],
  providers: [CronGuard, RetentionService],
})
export class RetentionModule {}
