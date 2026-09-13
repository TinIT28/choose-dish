import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getLocalDate, getLocalDates } from '../selections/selection-rules';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, now = new Date()) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { timezone: true, historyRetentionDays: true } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    const currentLocalDate = getLocalDate(now, user.timezone);
    const dates = getLocalDates(currentLocalDate, user.historyRetentionDays);
    const selections = await this.prisma.selection.findMany({
      where: { userId, localDate: { in: dates } },
      orderBy: [{ localDate: 'desc' }, { selectedAt: 'desc' }],
    });
    const groups = new Map<string, typeof selections>();
    for (const selection of selections) {
      const group = groups.get(selection.localDate) ?? [];
      group.push(selection);
      groups.set(selection.localDate, group);
    }
    return Array.from(groups, ([localDate, groupSelections]) => ({ localDate, selections: groupSelections }));
  }
}
