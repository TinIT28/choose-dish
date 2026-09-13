import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RetentionService {
  constructor(private readonly prisma: PrismaService) {}

  async cleanup(now = new Date()) {
    const users = await this.prisma.user.findMany({ select: { id: true, historyRetentionDays: true } });
    let deleted = 0;
    for (const user of users) {
      const cutoff = new Date(now.getTime() - user.historyRetentionDays * 24 * 60 * 60 * 1000);
      const result = await this.prisma.selection.deleteMany({ where: { userId: user.id, selectedAt: { lt: cutoff } } });
      deleted += result.count;
    }
    return { deleted, users: users.length };
  }
}
