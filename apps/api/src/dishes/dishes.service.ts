import { Injectable } from '@nestjs/common';
import type { CreateDishInput, UpdateDishInput } from '@choose-dish/contract';
import { DishScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { DishCatalog, toDishView } from './dish-catalog';

@Injectable()
export class DishesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: DishCatalog,
    private readonly cloudinary: CloudinaryService,
  ) {}

  listPrivate(userId: string) {
    return this.catalog.listPrivate(userId);
  }

  async createPrivate(userId: string, input: CreateDishInput) {
    this.catalog.assertUsableImage(input);
    try {
      const created = await this.prisma.dish.create({
        data: {
          scope: DishScope.PRIVATE,
          ownerId: userId,
          name: input.name.trim(),
          shortDescription: input.shortDescription.trim(),
          imageUrl: input.imageUrl.trim(),
          cloudinaryPublicId: input.cloudinaryPublicId.trim(),
        },
      });
      return toDishView(created);
    } catch (error) {
      await this.cloudinary.destroyImage(input.cloudinaryPublicId).catch(() => undefined);
      throw error;
    }
  }

  async updatePrivate(userId: string, dishId: string, input: UpdateDishInput) {
    const dish = await this.catalog.requireOwnedPrivate(userId, dishId);
    const replacesImage = input.imageUrl !== undefined || input.cloudinaryPublicId !== undefined;
    if (replacesImage) {
      this.catalog.assertUsableImage({
        imageUrl: input.imageUrl ?? dish.imageUrl,
        cloudinaryPublicId: input.cloudinaryPublicId ?? dish.cloudinaryPublicId,
      });
    }

    try {
      const updated = await this.prisma.dish.update({
        where: { id: dishId },
        data: {
          ...(input.name === undefined ? {} : { name: input.name.trim() }),
          ...(input.shortDescription === undefined ? {} : { shortDescription: input.shortDescription.trim() }),
          ...(input.imageUrl === undefined ? {} : { imageUrl: input.imageUrl.trim() }),
          ...(input.cloudinaryPublicId === undefined ? {} : { cloudinaryPublicId: input.cloudinaryPublicId.trim() }),
        },
      });
      if (replacesImage && input.cloudinaryPublicId && input.cloudinaryPublicId !== dish.cloudinaryPublicId) {
        const references = await this.prisma.dish.count({ where: { cloudinaryPublicId: dish.cloudinaryPublicId, NOT: { id: dishId } } });
        if (references === 0) await this.cloudinary.destroyImage(dish.cloudinaryPublicId).catch(() => undefined);
      }
      return toDishView(updated);
    } catch (error) {
      if (input.cloudinaryPublicId && input.cloudinaryPublicId !== dish.cloudinaryPublicId) {
        await this.cloudinary.destroyImage(input.cloudinaryPublicId).catch(() => undefined);
      }
      throw error;
    }
  }

  async deletePrivate(userId: string, dishId: string) {
    await this.catalog.requireOwnedPrivate(userId, dishId);
    return this.catalog.remove(dishId);
  }

  uploadSignature() {
    return this.cloudinary.getUploadSignature();
  }

  listSharedForUser(userId: string) {
    return this.catalog.listSharedFor(userId);
  }

  async copyShared(userId: string, dishId: string) {
    const dish = await this.catalog.requireShared(dishId);
    const copy = await this.prisma.dish.create({
      data: {
        scope: DishScope.PRIVATE,
        ownerId: userId,
        name: dish.name,
        shortDescription: dish.shortDescription,
        imageUrl: dish.imageUrl,
        cloudinaryPublicId: dish.cloudinaryPublicId,
      },
    });
    return toDishView(copy);
  }

  async excludeShared(userId: string, dishId: string) {
    await this.catalog.requireShared(dishId);
    return this.prisma.personalExclusion.upsert({
      where: { userId_dishId: { userId, dishId } },
      create: { userId, dishId },
      update: {},
    });
  }

  async unexcludeShared(userId: string, dishId: string) {
    await this.catalog.requireShared(dishId);
    return this.prisma.personalExclusion.deleteMany({ where: { userId, dishId } });
  }
}
