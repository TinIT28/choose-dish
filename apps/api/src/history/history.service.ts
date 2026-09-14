import { Injectable } from '@nestjs/common';
import type { HistoryGroupView, HistorySelectionView } from '@choose-dish/contract';
import { PrismaService } from '../prisma/prisma.service';
import { SelectionCalendar } from '../selections/selection-calendar';

@Injectable()
export class HistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calendar: SelectionCalendar,
  ) {}

  async list(userId: string, now = new Date()): Promise<HistoryGroupView[]> {
    const { retentionCutoff } = await this.calendar.forUser(userId, now);
    // Filtered on the same column it is grouped and ordered by, so the retention
    // boundary falls on a local day rather than on an instant.
    const selections = await this.prisma.selection.findMany({
      where: { userId, localDate: { gte: retentionCutoff } },
      orderBy: [{ localDate: 'desc' }, { selectedAt: 'desc' }],
      select: { id: true, localDate: true, mealPeriod: true, dishNameSnapshot: true, selectedAt: true },
    });

    const groups = new Map<string, HistorySelectionView[]>();
    for (const selection of selections) {
      const group = groups.get(selection.localDate) ?? [];
      group.push({ ...selection, selectedAt: selection.selectedAt.toISOString() });
      groups.set(selection.localDate, group);
    }
    return Array.from(groups, ([localDate, groupSelections]) => ({ localDate, selections: groupSelections }));
  }
}
