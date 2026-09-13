import { describe, expect, it, vi } from 'vitest';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
  it('groups read-only snapshots by the user local date', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 30 }) },
      selection: {
        findMany: vi.fn().mockResolvedValue([
          { localDate: '2026-09-13', mealPeriod: 'LUNCH', dishNameSnapshot: 'Cơm tấm' },
          { localDate: '2026-09-12', mealPeriod: 'DINNER', dishNameSnapshot: 'Bún bò' },
          { localDate: '2026-09-13', mealPeriod: 'BREAKFAST', dishNameSnapshot: 'Bánh mì' },
        ]),
      },
    };
    const service = new HistoryService(prisma as never);

    const result = await service.list('user-1', new Date('2026-09-13T05:00:00.000Z'));

    expect(result).toEqual([
      { localDate: '2026-09-13', selections: [expect.objectContaining({ dishNameSnapshot: 'Cơm tấm' }), expect.objectContaining({ dishNameSnapshot: 'Bánh mì' })] },
      { localDate: '2026-09-12', selections: [expect.objectContaining({ dishNameSnapshot: 'Bún bò' })] },
    ]);
  });
});
