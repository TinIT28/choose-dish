import { MealPeriod } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { createPrismaFake } from './prisma-fake';

describe('createPrismaFake', () => {
  it('applies scalar, null and relation filters the way the services rely on', async () => {
    const prisma = createPrismaFake({
      users: [{ id: 'user-1' }],
      dishes: [
        { id: 'private-live', scope: 'PRIVATE', ownerId: 'user-1' },
        { id: 'private-deleted', scope: 'PRIVATE', ownerId: 'user-1', isActive: false, deletedAt: new Date() },
        { id: 'private-other-owner', scope: 'PRIVATE', ownerId: 'user-2' },
        { id: 'shared-live', scope: 'SHARED', ownerId: null },
        { id: 'shared-excluded', scope: 'SHARED', ownerId: null },
      ],
      personalExclusions: [{ id: 'exclusion-1', userId: 'user-1', dishId: 'shared-excluded' }],
    });

    const visible = await prisma.dish.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { scope: 'PRIVATE', ownerId: 'user-1' },
          { scope: 'SHARED', exclusions: { none: { userId: 'user-1' } } },
        ],
      },
      select: { id: true },
    });

    expect(visible.map((dish: { id: string }) => dish.id).sort()).toEqual(['private-live', 'shared-live']);
  });

  it('resolves include with its own where clause', async () => {
    const prisma = createPrismaFake({
      dishes: [{ id: 'shared-1', scope: 'SHARED' }],
      personalExclusions: [
        { id: 'exclusion-1', userId: 'user-1', dishId: 'shared-1' },
        { id: 'exclusion-2', userId: 'user-2', dishId: 'shared-1' },
      ],
    });

    const [dish] = await prisma.dish.findMany({
      where: { scope: 'SHARED' },
      include: { exclusions: { where: { userId: 'user-1' }, select: { id: true } } },
    });

    expect(dish.exclusions).toEqual([{ id: 'exclusion-1' }]);
  });

  it('orders by a single key and by a list of keys', async () => {
    const prisma = createPrismaFake({
      selections: [
        { id: 'a', userId: 'user-1', localDate: '2026-09-12', selectedAt: new Date('2026-09-12T10:00:00Z') },
        { id: 'b', userId: 'user-1', localDate: '2026-09-13', selectedAt: new Date('2026-09-13T08:00:00Z') },
        { id: 'c', userId: 'user-1', localDate: '2026-09-13', selectedAt: new Date('2026-09-13T12:00:00Z') },
      ],
    });

    const selections = await prisma.selection.findMany({
      where: { userId: 'user-1' },
      orderBy: [{ localDate: 'desc' }, { selectedAt: 'desc' }],
    });

    expect(selections.map((selection: { id: string }) => selection.id)).toEqual(['c', 'b', 'a']);
  });

  it('supports in, lt and NOT filters', async () => {
    const prisma = createPrismaFake({
      selections: [
        { id: 'a', userId: 'user-1', localDate: '2026-09-11', selectedAt: new Date('2026-09-11T10:00:00Z') },
        { id: 'b', userId: 'user-1', localDate: '2026-09-13', selectedAt: new Date('2026-09-13T10:00:00Z') },
      ],
      dishes: [
        { id: 'dish-1', cloudinaryPublicId: 'image-1' },
        { id: 'dish-2', cloudinaryPublicId: 'image-1' },
      ],
    });

    const recent = await prisma.selection.findMany({ where: { userId: 'user-1', localDate: { in: ['2026-09-13'] } } });
    const stale = await prisma.selection.findMany({ where: { selectedAt: { lt: new Date('2026-09-12T00:00:00Z') } } });
    const otherReferences = await prisma.dish.count({ where: { cloudinaryPublicId: 'image-1', NOT: { id: 'dish-1' } } });

    expect(recent.map((selection: { id: string }) => selection.id)).toEqual(['b']);
    expect(stale.map((selection: { id: string }) => selection.id)).toEqual(['a']);
    expect(otherReferences).toBe(1);
  });

  it('creates and updates through a compound unique key', async () => {
    const prisma = createPrismaFake({ dishes: [{ id: 'dish-1' }, { id: 'dish-2' }] });
    const key = { userId: 'user-1', localDate: '2026-09-13', mealPeriod: MealPeriod.LUNCH };

    await prisma.selection.upsert({
      where: { userId_localDate_mealPeriod: key },
      create: { ...key, dishId: 'dish-1', dishNameSnapshot: 'Cơm tấm' },
      update: {},
    });
    await prisma.selection.upsert({
      where: { userId_localDate_mealPeriod: key },
      create: { ...key, dishId: 'dish-1', dishNameSnapshot: 'Cơm tấm' },
      update: { dishId: 'dish-2', dishNameSnapshot: 'Bún bò' },
    });

    const selections = await prisma.selection.findMany({ where: { userId: 'user-1' } });
    expect(selections).toHaveLength(1);
    expect(selections[0]).toMatchObject({ dishId: 'dish-2', dishNameSnapshot: 'Bún bò' });
  });

  it('fills in the defaults the schema declares', async () => {
    const prisma = createPrismaFake();

    const dish = await prisma.dish.create({
      data: { scope: 'PRIVATE', ownerId: 'user-1', name: 'Phở', shortDescription: 'Bò tái', imageUrl: 'https://example.com/a.jpg', cloudinaryPublicId: 'a' },
    });

    expect(dish.id).toEqual(expect.any(String));
    expect(dish.isActive).toBe(true);
    expect(dish.deletedAt).toBeNull();
    expect(dish.createdAt).toBeInstanceOf(Date);
  });

  it('runs an interactive transaction against the same store', async () => {
    const prisma = createPrismaFake({
      users: [{ id: 'user-1' }],
      selections: [{ id: 'selection-1', userId: 'user-1' }],
    });

    await prisma.$transaction(async (transaction) => {
      await transaction.selection.deleteMany({ where: { userId: 'user-1' } });
      return transaction.user.delete({ where: { id: 'user-1' } });
    });

    expect(await prisma.selection.findMany({})).toEqual([]);
    expect(await prisma.user.findUnique({ where: { id: 'user-1' } })).toBeNull();
  });

  it('finds a record by a non-id unique field and follows an include to its relation', async () => {
    const prisma = createPrismaFake({
      users: [{ id: 'user-1', email: 'user@example.com' }],
      sessions: [{ id: 'session-1', userId: 'user-1' }],
    });

    const user = await prisma.user.findUnique({ where: { email: 'user@example.com' } });
    const session = await prisma.session.findUnique({ where: { id: 'session-1' }, include: { user: true } });

    expect(user).toMatchObject({ id: 'user-1' });
    expect(session?.user).toMatchObject({ id: 'user-1', email: 'user@example.com' });
  });

  it('rejects a row the schema unique constraints would reject', async () => {
    const prisma = createPrismaFake({
      users: [{ id: 'user-1', email: 'user@example.com' }],
      personalExclusions: [{ userId: 'user-1', dishId: 'dish-1' }],
    });

    await expect(prisma.user.create({ data: { email: 'user@example.com', passwordHash: 'hash' } })).rejects.toMatchObject({ code: 'P2002' });
    await expect(prisma.personalExclusion.create({ data: { userId: 'user-1', dishId: 'dish-1' } })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('treats null keys as distinct, the way Postgres does', async () => {
    const prisma = createPrismaFake({ dishes: [{ id: 'shared-1', scope: 'SHARED', ownerId: null }] });

    await expect(prisma.dish.create({ data: { scope: 'SHARED', ownerId: null, name: 'Bún chả' } as never })).resolves.toMatchObject({ name: 'Bún chả' });
  });

  it('stamps updatedAt only on the models that declare the column', async () => {
    const prisma = createPrismaFake({ sessions: [{ id: 'session-1', userId: 'user-1' }], dishes: [{ id: 'dish-1' }] });

    await prisma.session.update({ where: { id: 'session-1' }, data: { revokedAt: new Date() } });
    await prisma.dish.update({ where: { id: 'dish-1' }, data: { name: 'Phở' } });

    expect(prisma.store.session[0]).not.toHaveProperty('updatedAt');
    expect(prisma.store.dish[0].updatedAt).toBeInstanceOf(Date);
  });

  it('reports how many rows updateMany and deleteMany touched', async () => {
    const prisma = createPrismaFake({
      sessions: [
        { id: 'session-1', userId: 'user-1' },
        { id: 'session-2', userId: 'user-1', revokedAt: new Date() },
      ],
    });

    const revoked = await prisma.session.updateMany({ where: { userId: 'user-1', revokedAt: null }, data: { revokedAt: new Date() } });
    const removed = await prisma.session.deleteMany({ where: { userId: 'user-2' } });

    expect(revoked.count).toBe(1);
    expect(removed.count).toBe(0);
  });
});
