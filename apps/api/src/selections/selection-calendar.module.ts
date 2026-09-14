import { Module } from '@nestjs/common';
import { SelectionCalendar } from './selection-calendar';

@Module({
  providers: [SelectionCalendar],
  exports: [SelectionCalendar],
})
export class SelectionCalendarModule {}
