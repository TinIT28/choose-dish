import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SelectionCalendarModule } from '../selections/selection-calendar.module';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

@Module({
  imports: [AuthModule, SelectionCalendarModule],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
