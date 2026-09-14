import { describe, expect, it } from 'vitest';
import { createPrismaFake, type PrismaFakeSeed } from '../testing/prisma-fake';
import { MANAGED_IMAGE_URL, UNMANAGED_IMAGE_URL, makeCloudinaryService } from '../testing/test-config';
import { DishCatalog } from './dish-catalog';
import { DishesService } from './dishes.service';

function makeService(seed: PrismaFakeSeed = {}) {
  const prisma = createPrismaFake(seed);
  const cloudinary = makeCloudinaryService();
  return { prisma, service: new DishesService(prisma, new DishCatalog(prisma, cloudinary), cloudinary) };
}

const validInput = {
  name: 'Phở',
  shortDescription: 'Nước dùng bò',
  imageUrl: MANAGED_IMAGE_URL,
  cloudinaryPublicId: 'pho',
};

describe('DishesService', () => {
  it('lists only the live private dishes owned by the user', async () => {
    const { service } = makeService({
      dishes: [
        { id: 'mine', scope: 'PRIVATE', ownerId: 'user-1' },
        { id: 'mine-deleted', scope: 'PRIVATE', ownerId: 'user-1', isActive: false, deletedAt: new Date() },
        { id: 'someone-elses', scope: 'PRIVATE', ownerId: 'user-2' },
        { id: 'shared', scope: 'SHARED', ownerId: null },
      ],
    });

    const dishes = await service.listPrivate('user-1');

    expect(dishes.map((dish) => dish.id)).toEqual(['mine']);
  });

  it('requires both image fields when creating a dish', async () => {
    const { service } = makeService();

    await expect(service.createPrivate('user-1', { ...validInput, imageUrl: '', cloudinaryPublicId: '' })).rejects.toMatchObject({ status: 400 });
  });

  it('refuses an image that is not hosted on the configured cloud', async () => {
    const { service } = makeService();

    await expect(service.createPrivate('user-1', { ...validInput, imageUrl: UNMANAGED_IMAGE_URL })).rejects.toMatchObject({ status: 400 });
  });

  it('stores a created dish in the private catalog of its owner', async () => {
    const { prisma, service } = makeService();

    await service.createPrivate('user-1', { ...validInput, name: '  Phở  ' });

    expect(await service.listPrivate('user-1')).toEqual([expect.objectContaining({ name: 'Phở' })]);
    expect(prisma.store.dish[0]).toMatchObject({ scope: 'PRIVATE', ownerId: 'user-1' });
  });

  it('keeps ownership and soft-delete bookkeeping out of the response', async () => {
    const { service } = makeService({ dishes: [{ id: 'mine', scope: 'PRIVATE', ownerId: 'user-1' }] });

    const [dish] = await service.listPrivate('user-1');

    expect(Object.keys(dish).sort()).toEqual(['cloudinaryPublicId', 'id', 'imageUrl', 'isActive', 'name', 'shortDescription']);
  });

  it('refuses to touch a dish owned by someone else', async () => {
    const { service } = makeService({ dishes: [{ id: 'dish-1', scope: 'PRIVATE', ownerId: 'other-user' }] });

    await expect(service.updatePrivate('user-1', 'dish-1', { name: 'Món mới' })).rejects.toMatchObject({ status: 403 });
    await expect(service.deletePrivate('user-1', 'dish-1')).rejects.toMatchObject({ status: 403 });
  });

  it('soft-deletes an owned dish so it leaves the catalog without losing the row', async () => {
    const { prisma, service } = makeService({ dishes: [{ id: 'dish-1', scope: 'PRIVATE', ownerId: 'user-1' }] });

    await service.deletePrivate('user-1', 'dish-1');

    expect(await service.listPrivate('user-1')).toEqual([]);
    expect(prisma.store.dish).toHaveLength(1);
    expect(prisma.store.dish[0]).toMatchObject({ isActive: false, deletedAt: expect.any(Date) });
  });

  it('copies a shared dish into the private catalog of the user', async () => {
    const { prisma, service } = makeService({ dishes: [{ id: 'shared-1', scope: 'SHARED', ownerId: null, name: 'Bún bò' }] });

    await service.copyShared('user-1', 'shared-1');

    expect(await service.listPrivate('user-1')).toEqual([expect.objectContaining({ name: 'Bún bò' })]);
    expect(prisma.store.dish.find((dish) => dish.scope === 'PRIVATE')).toMatchObject({ ownerId: 'user-1' });
  });

  it('refuses to copy a shared dish that has been removed', async () => {
    const { service } = makeService({ dishes: [{ id: 'shared-1', scope: 'SHARED', ownerId: null, isActive: false, deletedAt: new Date() }] });

    await expect(service.copyShared('user-1', 'shared-1')).rejects.toMatchObject({ status: 404 });
  });

  it('marks a shared dish as excluded for the user who excluded it and no one else', async () => {
    const { service } = makeService({ dishes: [{ id: 'shared-1', scope: 'SHARED', ownerId: null }] });

    await service.excludeShared('user-1', 'shared-1');

    expect(await service.listSharedForUser('user-1')).toEqual([expect.objectContaining({ id: 'shared-1', isExcluded: true })]);
    expect(await service.listSharedForUser('user-2')).toEqual([expect.objectContaining({ id: 'shared-1', isExcluded: false })]);
  });

  it('excluding the same shared dish twice leaves one exclusion', async () => {
    const { prisma, service } = makeService({ dishes: [{ id: 'shared-1', scope: 'SHARED', ownerId: null }] });

    await service.excludeShared('user-1', 'shared-1');
    await service.excludeShared('user-1', 'shared-1');

    expect(prisma.store.personalExclusion).toHaveLength(1);
  });

  it('restores an excluded shared dish', async () => {
    const { service } = makeService({ dishes: [{ id: 'shared-1', scope: 'SHARED', ownerId: null }] });

    await service.excludeShared('user-1', 'shared-1');
    await service.unexcludeShared('user-1', 'shared-1');

    expect(await service.listSharedForUser('user-1')).toEqual([expect.objectContaining({ isExcluded: false })]);
  });
});
