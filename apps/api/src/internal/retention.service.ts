import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SelectionCalendar } from '../selections/selection-calendar';

@Injectable()
export class RetentionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calendar: SelectionCalendar,
  ) {}

  async cleanup(now = new Date()) {
    const calendars = await this.calendar.forEveryUser(now);
    let deleted = 0;
    for (const { userId, retentionCutoff } of calendars) {
      const result = await this.prisma.selection.deleteMany({ where: { userId, localDate: { lt: retentionCutoff } } });
      deleted += result.count;
    }
    return { deleted, users: calendars.length };
  }
}
