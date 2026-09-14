import { describe, expect, it } from 'vitest';
import { createPrismaFake, type PrismaFakeSeed } from '../testing/prisma-fake';
import { MANAGED_IMAGE_URL, UNMANAGED_IMAGE_URL, makeCloudinaryService } from '../testing/test-config';
import { DishCatalog } from './dish-catalog';

function makeCatalog(seed: PrismaFakeSeed = {}) {
  const prisma = createPrismaFake(seed);
  return { prisma, catalog: new DishCatalog(prisma, makeCloudinaryService()) };
}

/** One mixed catalog, so every reader is checked against the same set of rows. */
const mixedCatalog: PrismaFakeSeed = {
  dishes: [
    { id: 'mine', scope: 'PRIVATE', ownerId: 'user-1', name: 'Cơm tấm' },
    { id: 'mine-removed', scope: 'PRIVATE', ownerId: 'user-1', isActive: false, deletedAt: new Date() },
    { id: 'someone-elses', scope: 'PRIVATE', ownerId: 'user-2' },
    { id: 'shared-kept', scope: 'SHARED', ownerId: null, name: 'Bánh mì' },
    { id: 'shared-excluded', scope: 'SHARED', ownerId: null, name: 'Lòng lợn' },
    { id: 'shared-removed', scope: 'SHARED', ownerId: null, isActive: false, deletedAt: new Date() },
  ],
  personalExclusions: [{ userId: 'user-1', dishId: 'shared-excluded' }],
};

describe('DishCatalog', () => {
  it('lists the live private dishes of one user', async () => {
    const { catalog } = makeCatalog(mixedCatalog);

    expect((await catalog.listPrivate('user-1')).map((dish) => dish.id)).toEqual(['mine']);
  });

  it('lists the live shared dishes for an administrator', async () => {
    const { catalog } = makeCatalog(mixedCatalog);

    expect((await catalog.listShared()).map((dish) => dish.id).sort()).toEqual(['shared-excluded', 'shared-kept']);
  });

  it('marks personal exclusions on the shared catalog of one user', async () => {
    const { catalog } = makeCatalog(mixedCatalog);

    const shared = await catalog.listSharedFor('user-1');

    expect(shared.find((dish) => dish.id === 'shared-excluded')?.isExcluded).toBe(true);
    expect(shared.find((dish) => dish.id === 'shared-kept')?.isExcluded).toBe(false);
  });

  it('offers the same exclusion decision to the selection pool as to the shared catalog', async () => {
    const { catalog } = makeCatalog(mixedCatalog);

    const selectable = await catalog.listSelectable('user-1');

    expect(selectable.map((dish) => dish.id).sort()).toEqual(['mine', 'shared-kept']);
  });

  it('gives another user their own view of the same shared dishes', async () => {
    const { catalog } = makeCatalog(mixedCatalog);

    expect((await catalog.listSelectable('user-2')).map((dish) => dish.id).sort()).toEqual(['shared-excluded', 'shared-kept', 'someone-elses']);
  });

  it('refuses a private dish that the user does not own', async () => {
    const { catalog } = makeCatalog(mixedCatalog);

    await expect(catalog.requireOwnedPrivate('user-1', 'someone-elses')).rejects.toMatchObject({ status: 403 });
    await expect(catalog.requireOwnedPrivate('user-1', 'shared-kept')).rejects.toMatchObject({ status: 403 });
    await expect(catalog.requireOwnedPrivate('user-1', 'no-such-dish')).rejects.toMatchObject({ status: 404 });
  });

  it('returns an owned private dish even after it was removed, so the owner sees a stable error', async () => {
    const { catalog } = makeCatalog(mixedCatalog);

    await expect(catalog.requireOwnedPrivate('user-1', 'mine')).resolves.toMatchObject({ id: 'mine' });
  });

  it('accepts only a live shared dish', async () => {
    const { catalog } = makeCatalog(mixedCatalog);

    await expect(catalog.requireShared('shared-kept')).resolves.toMatchObject({ id: 'shared-kept' });
    await expect(catalog.requireShared('shared-removed')).rejects.toMatchObject({ status: 404 });
    await expect(catalog.requireShared('mine')).rejects.toMatchObject({ status: 404 });
    await expect(catalog.requireShared('no-such-dish')).rejects.toMatchObject({ status: 404 });
  });

  it('removes a dish from every reader without deleting the row', async () => {
    const { prisma, catalog } = makeCatalog(mixedCatalog);

    await catalog.remove('shared-kept');

    expect((await catalog.listShared()).map((dish) => dish.id)).toEqual(['shared-excluded']);
    expect((await catalog.listSelectable('user-2')).map((dish) => dish.id).sort()).toEqual(['shared-excluded', 'someone-elses']);
    expect(prisma.store.dish.find((dish) => dish.id === 'shared-kept')).toMatchObject({ isActive: false, deletedAt: expect.any(Date) });
  });

  it('requires both image fields and rejects an image outside the configured cloud', () => {
    const { catalog } = makeCatalog();

    expect(() => catalog.assertUsableImage({ imageUrl: '', cloudinaryPublicId: '' })).toThrow(/ảnh và mã Cloudinary/);
    expect(() => catalog.assertUsableImage({ imageUrl: MANAGED_IMAGE_URL, cloudinaryPublicId: '  ' })).toThrow(/ảnh và mã Cloudinary/);
    expect(() => catalog.assertUsableImage({ imageUrl: UNMANAGED_IMAGE_URL, cloudinaryPublicId: 'a' })).toThrow(/Cloudinary đã cấu hình/);
    expect(() => catalog.assertUsableImage({ imageUrl: MANAGED_IMAGE_URL, cloudinaryPublicId: 'a' })).not.toThrow();
  });
});
