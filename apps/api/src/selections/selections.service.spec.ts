import { MealPeriod, Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { DishCatalog } from '../dishes/dish-catalog';
import { createPrismaFake, type PrismaFakeSeed } from '../testing/prisma-fake';
import { makeCloudinaryService } from '../testing/test-config';
import { SelectionCalendar } from './selection-calendar';
import { SelectionsService } from './selections.service';

const now = new Date('2026-09-13T05:00:00.000Z');

function makeService(seed: PrismaFakeSeed = {}) {
  const prisma = createPrismaFake({ users: [{ id: 'user-1', timezone: 'Asia/Ho_Chi_Minh' }], ...seed });
  const service = new SelectionsService(prisma, new DishCatalog(prisma, makeCloudinaryService()), new SelectionCalendar(prisma));
  return { prisma, service };
}

describe('SelectionsService', () => {
  it('avoids a dish the user chose inside the no-repeat window', async () => {
    const { service } = makeService({
      dishes: [
        { id: 'dish-a', scope: 'PRIVATE', ownerId: 'user-1', name: 'Cơm tấm' },
        { id: 'dish-b', scope: 'PRIVATE', ownerId: 'user-1', name: 'Bún bò' },
      ],
      selections: [{ id: 'yesterday', userId: 'user-1', dishId: 'dish-a', localDate: '2026-09-12', mealPeriod: 'DINNER' }],
    });

    const selection = await service.selectRandom('user-1', MealPeriod.LUNCH, now);

    expect(selection).toMatchObject({ dishId: 'dish-b', dishNameSnapshot: 'Bún bò', localDate: '2026-09-13', mealPeriod: 'LUNCH' });
  });

  it('records the selection against the local date of the user timezone', async () => {
    const { service } = makeService({
      users: [{ id: 'user-1', timezone: 'Pacific/Kiritimati' }],
      dishes: [{ id: 'dish-a', scope: 'PRIVATE', ownerId: 'user-1', name: 'Cơm tấm' }],
    });

    const selection = await service.selectRandom('user-1', MealPeriod.LUNCH, new Date('2026-09-13T20:00:00.000Z'));

    expect(selection?.localDate).toBe('2026-09-14');
  });

  it('replaces the existing selection for the same date and meal period', async () => {
    const { prisma, service } = makeService({
      dishes: [{ id: 'dish-a', scope: 'PRIVATE', ownerId: 'user-1', name: 'Cơm tấm' }],
    });

    await service.selectRandom('user-1', MealPeriod.LUNCH, now);
    await service.selectRandom('user-1', MealPeriod.LUNCH, now);

    expect(prisma.store.selection).toHaveLength(1);
  });

  it('draws from shared dishes the user has not personally excluded', async () => {
    const { service } = makeService({
      dishes: [
        { id: 'shared-kept', scope: 'SHARED', ownerId: null, name: 'Bánh mì' },
        { id: 'shared-excluded', scope: 'SHARED', ownerId: null, name: 'Lòng lợn' },
      ],
      personalExclusions: [{ userId: 'user-1', dishId: 'shared-excluded' }],
    });

    const selection = await service.selectRandom('user-1', MealPeriod.BREAKFAST, now);

    expect(selection).toMatchObject({ dishId: 'shared-kept' });
  });

  it('ignores private dishes belonging to another user and removed dishes', async () => {
    const { service } = makeService({
      dishes: [
        { id: 'someone-elses', scope: 'PRIVATE', ownerId: 'user-2', name: 'Cơm gà' },
        { id: 'removed', scope: 'SHARED', ownerId: null, isActive: false, deletedAt: new Date(), name: 'Cháo' },
      ],
    });

    await expect(service.selectRandom('user-1', MealPeriod.DINNER, now)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'NO_AVAILABLE_DISH' }),
    });
  });

  it('returns a typed conflict when the catalog is empty', async () => {
    const { service } = makeService();

    await expect(service.selectRandom('user-1', MealPeriod.DINNER, now)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'NO_AVAILABLE_DISH' }),
    });
  });

  it('lists only the selections made on the local date of the user', async () => {
    const { service } = makeService({
      selections: [
        { id: 'today-lunch', userId: 'user-1', localDate: '2026-09-13', mealPeriod: 'LUNCH' },
        { id: 'yesterday', userId: 'user-1', localDate: '2026-09-12', mealPeriod: 'LUNCH' },
        { id: 'someone-else', userId: 'user-2', localDate: '2026-09-13', mealPeriod: 'LUNCH' },
      ],
    });

    const selections = await service.listToday('user-1', now);

    expect(selections.map((selection) => selection.id)).toEqual(['today-lunch']);
  });

  it('sends the selection time as an ISO string rather than a Date', async () => {
    const { service } = makeService({ dishes: [{ id: 'dish-a', scope: 'PRIVATE', ownerId: 'user-1', name: 'Cơm tấm' }] });

    const selection = await service.selectRandom('user-1', MealPeriod.LUNCH, now);

    expect(selection.selectedAt).toBe('2026-09-13T05:00:00.000Z');
  });

  it('returns the winning selection when another request claims the same slot first', async () => {
    const { prisma, service } = makeService({
      dishes: [{ id: 'dish-a', scope: 'PRIVATE', ownerId: 'user-1', name: 'Cơm tấm' }],
    });
    // Simulate the row landing between our read and our write.
    const claimedFirst = async ({ create }: { create: Record<string, unknown> }) => {
      await prisma.selection.create({ data: { ...create, dishNameSnapshot: 'Bún bò' } as never });
      throw new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: 'test' });
    };
    prisma.selection.upsert = claimedFirst as unknown as typeof prisma.selection.upsert;

    const selection = await service.selectRandom('user-1', MealPeriod.LUNCH, now);

    expect(selection).toMatchObject({ dishNameSnapshot: 'Bún bò', mealPeriod: 'LUNCH' });
  });

  it('reports a missing account rather than selecting for it', async () => {
    const { service } = makeService();

    await expect(service.selectRandom('ghost', MealPeriod.LUNCH, now)).rejects.toMatchObject({ status: 404 });
    await expect(service.listToday('ghost', now)).rejects.toMatchObject({ status: 404 });
  });
});
