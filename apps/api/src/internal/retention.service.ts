import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getLocalDate, getLocalDates } from '../selections/selection-rules';

@Injectable()
export class RetentionService {
  constructor(private readonly prisma: PrismaService) {}

  async cleanup(now = new Date()) {
    const users = await this.prisma.user.findMany({ select: { id: true, timezone: true, historyRetentionDays: true } });
    let deleted = 0;
    for (const user of users) {
      const currentDate = getLocalDate(now, user.timezone);
      const retainedDates = getLocalDates(currentDate, user.historyRetentionDays);
      const oldestRetainedDate = retainedDates[retainedDates.length - 1];
      const result = await this.prisma.selection.deleteMany({ where: { userId: user.id, localDate: { lt: oldestRetainedDate } } });
      deleted += result.count;
    }
    return { deleted, users: users.length };
  }
}
