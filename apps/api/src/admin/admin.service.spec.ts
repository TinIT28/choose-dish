import { describe, expect, it } from 'vitest';
import { createPrismaFake, type PrismaFakeSeed } from '../testing/prisma-fake';
import { MANAGED_IMAGE_URL, UNMANAGED_IMAGE_URL, makeCloudinaryService } from '../testing/test-config';
import { DishCatalog } from '../dishes/dish-catalog';
import { AdminService } from './admin.service';

function makeService(seed: PrismaFakeSeed = {}) {
  const prisma = createPrismaFake(seed);
  return { prisma, service: new AdminService(prisma, new DishCatalog(prisma, makeCloudinaryService())) };
}

const validInput = {
  name: 'Bún chả',
  shortDescription: 'Chả nướng',
  imageUrl: MANAGED_IMAGE_URL,
  cloudinaryPublicId: 'bun-cha',
};

describe('AdminService', () => {
  it('publishes a shared dish that belongs to no owner', async () => {
    const { prisma, service } = makeService();

    await service.createShared(validInput);

    expect(await service.listShared()).toEqual([expect.objectContaining({ name: 'Bún chả' })]);
    expect(prisma.store.dish[0]).toMatchObject({ scope: 'SHARED', ownerId: null });
  });

  it('refuses a shared dish whose image is not on the configured cloud', async () => {
    const { service } = makeService();

    await expect(service.createShared({ ...validInput, imageUrl: UNMANAGED_IMAGE_URL })).rejects.toMatchObject({ status: 400 });
  });

  it('refuses to update or delete a dish that is not a live shared dish', async () => {
    const { service } = makeService({
      dishes: [
        { id: 'private-1', scope: 'PRIVATE', ownerId: 'user-1' },
        { id: 'removed-1', scope: 'SHARED', ownerId: null, isActive: false, deletedAt: new Date() },
      ],
    });

    await expect(service.updateShared('private-1', { name: 'Món mới' })).rejects.toMatchObject({ status: 404 });
    await expect(service.deleteShared('removed-1')).rejects.toMatchObject({ status: 404 });
  });

  it('soft-deletes a shared dish so it leaves the catalog without losing the row', async () => {
    const { prisma, service } = makeService({ dishes: [{ id: 'shared-1', scope: 'SHARED', ownerId: null }] });

    await service.deleteShared('shared-1');

    expect(await service.listShared()).toEqual([]);
    expect(prisma.store.dish[0]).toMatchObject({ isActive: false, deletedAt: expect.any(Date) });
  });

  it('lists accounts without exposing their password hashes', async () => {
    const { service } = makeService({
      users: [
        { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN', createdAt: new Date('2026-01-01') },
        { id: 'user-1', email: 'user@example.com', role: 'USER', createdAt: new Date('2026-02-01') },
      ],
    });

    const users = await service.listUsers();

    expect(users).toEqual([
      { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
      { id: 'user-1', email: 'user@example.com', role: 'USER' },
    ]);
  });

  it('replaces the stored password hash when resetting a password', async () => {
    const { prisma, service } = makeService({ users: [{ id: 'user-1', passwordHash: 'old-hash' }] });

    await service.resetPassword('user-1', 'a-new-strong-password');

    expect(prisma.store.user[0].passwordHash).not.toBe('old-hash');
  });
});
