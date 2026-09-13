import { describe, expect, it, vi } from 'vitest';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  it('copies a shared dish into an independent private dish', async () => {
    const sharedDish = {
      id: 'shared-1',
      scope: 'SHARED',
      ownerId: null,
      name: 'Bún bò Huế',
      shortDescription: 'Cay thơm',
      imageUrl: 'https://image.example/bun-bo.webp',
      cloudinaryPublicId: 'choose-dish/bun-bo',
      isActive: true,
      deletedAt: null,
    };
    const create = vi.fn().mockResolvedValue({ ...sharedDish, id: 'private-1', scope: 'PRIVATE', ownerId: 'user-1' });
    const prisma = { dish: { findUnique: vi.fn().mockResolvedValue(sharedDish), create } };
    const service = new AdminService(prisma as never);

    const result = await service.copySharedDish('user-1', 'shared-1');

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        scope: 'PRIVATE',
        ownerId: 'user-1',
        name: 'Bún bò Huế',
        imageUrl: sharedDish.imageUrl,
        cloudinaryPublicId: sharedDish.cloudinaryPublicId,
      }),
    });
    expect(result.id).toBe('private-1');
  });

  it('denies shared-dish management to a normal user', async () => {
    const service = new AdminService({} as never);

    await expect(service.assertAdmin({ role: 'USER' } as never)).rejects.toMatchObject({ status: 403 });
  });
});
