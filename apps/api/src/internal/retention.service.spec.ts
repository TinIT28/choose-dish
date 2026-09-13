import { describe, expect, it, vi } from 'vitest';
import { RetentionService } from './retention.service';

describe('RetentionService', () => {
  it('deletes only selections older than each user retention window', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 2 });
    const prisma = {
      user: { findMany: vi.fn().mockResolvedValue([{ id: 'user-1', historyRetentionDays: 30 }]) },
      selection: { deleteMany },
    };
    const service = new RetentionService(prisma as never);

    const result = await service.cleanup(new Date('2026-09-13T05:00:00.000Z'));

    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1', selectedAt: { lt: new Date('2026-08-14T05:00:00.000Z') } } });
    expect(result).toEqual({ deleted: 2, users: 1 });
  });
});
