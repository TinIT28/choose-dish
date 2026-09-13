import { describe, expect, it, vi } from 'vitest';
import { DishesService } from './dishes.service';

describe('DishesService', () => {
  it('lists only active private dishes owned by the user', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new DishesService({ dish: { findMany } } as never, {} as never);

    await service.listPrivate('user-1');

    expect(findMany).toHaveBeenCalledWith({
      where: { ownerId: 'user-1', scope: 'PRIVATE', isActive: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('requires both image fields when creating a dish', async () => {
    const service = new DishesService({} as never, {} as never);

    await expect(
      service.createPrivate('user-1', { name: 'Phở', shortDescription: 'Nước dùng bò', imageUrl: '', cloudinaryPublicId: '' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects updates for another user and soft-deletes owned dishes', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 'dish-1', ownerId: 'other-user', scope: 'PRIVATE' });
    const update = vi.fn().mockResolvedValue({ id: 'dish-1', deletedAt: new Date() });
    const prisma = { dish: { findUnique, update } };
    const service = new DishesService(prisma as never, {} as never);

    await expect(service.updatePrivate('user-1', 'dish-1', { name: 'Món mới' })).rejects.toMatchObject({ status: 403 });

    findUnique.mockResolvedValue({ id: 'dish-1', ownerId: 'user-1', scope: 'PRIVATE' });
    await service.deletePrivate('user-1', 'dish-1');
    expect(update).toHaveBeenCalledWith({ where: { id: 'dish-1' }, data: { isActive: false, deletedAt: expect.any(Date) } });
  });
});
