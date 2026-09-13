import { MealPeriod } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { SelectionsService } from './selections.service';

describe('SelectionsService', () => {
  it('randomizes from the accessible catalog and upserts the meal slot', async () => {
    const now = new Date('2026-09-13T05:00:00.000Z');
    const upsert = vi.fn().mockResolvedValue({ mealPeriod: MealPeriod.LUNCH, dishNameSnapshot: 'Cơm tấm' });
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ timezone: 'Asia/Ho_Chi_Minh' }) },
      dish: { findMany: vi.fn().mockResolvedValue([{ id: 'dish-a', name: 'Cơm tấm' }, { id: 'dish-b', name: 'Bún bò' }]) },
      selection: {
        findMany: vi.fn().mockResolvedValue([{ localDate: '2026-09-12', dishId: 'dish-a' }]),
        upsert,
      },
    };
    const service = new SelectionsService(prisma as never);

    await service.selectRandom('user-1', MealPeriod.LUNCH, now);

    expect(upsert).toHaveBeenCalledWith({
      where: { userId_localDate_mealPeriod: { userId: 'user-1', localDate: '2026-09-13', mealPeriod: MealPeriod.LUNCH } },
      update: { dishId: 'dish-b', dishNameSnapshot: 'Bún bò', selectedAt: now },
      create: { userId: 'user-1', localDate: '2026-09-13', mealPeriod: MealPeriod.LUNCH, dishId: 'dish-b', dishNameSnapshot: 'Bún bò', selectedAt: now },
    });
  });

  it('returns a typed conflict when no accessible dish remains', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ timezone: 'Asia/Ho_Chi_Minh' }) },
      dish: { findMany: vi.fn().mockResolvedValue([]) },
      selection: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const service = new SelectionsService(prisma as never);

    await expect(service.selectRandom('user-1', MealPeriod.DINNER)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'NO_AVAILABLE_DISH' }),
    });
  });
});
