import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DishScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import type { CreateDishInput, UpdateDishInput } from './dishes.types';

function validateImageFields(input: Partial<CreateDishInput>, cloudinary: CloudinaryService) {
  if (!input.imageUrl?.trim() || !input.cloudinaryPublicId?.trim()) {
    throw new BadRequestException('Món ăn cần có ảnh và mã Cloudinary');
  }
  if (!cloudinary.isManagedImageUrl(input.imageUrl)) {
    throw new BadRequestException('Ảnh món ăn phải nằm trên Cloudinary đã cấu hình');
  }
}

@Injectable()
export class DishesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  listPrivate(userId: string) {
    return this.prisma.dish.findMany({
      where: { ownerId: userId, scope: DishScope.PRIVATE, isActive: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPrivate(userId: string, input: CreateDishInput) {
    validateImageFields(input, this.cloudinary);
    try {
      return await this.prisma.dish.create({
        data: {
          scope: DishScope.PRIVATE,
          ownerId: userId,
          name: input.name.trim(),
          shortDescription: input.shortDescription.trim(),
          imageUrl: input.imageUrl.trim(),
          cloudinaryPublicId: input.cloudinaryPublicId.trim(),
        },
      });
    } catch (error) {
      await this.cloudinary.destroyImage(input.cloudinaryPublicId).catch(() => undefined);
      throw error;
    }
  }

  async updatePrivate(userId: string, dishId: string, input: UpdateDishInput) {
    const dish = await this.requireOwnedPrivateDish(userId, dishId);
    if (input.imageUrl !== undefined || input.cloudinaryPublicId !== undefined) {
      validateImageFields({ imageUrl: input.imageUrl ?? dish.imageUrl, cloudinaryPublicId: input.cloudinaryPublicId ?? dish.cloudinaryPublicId }, this.cloudinary);
    }

    const replacesImage = input.imageUrl !== undefined || input.cloudinaryPublicId !== undefined;
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
      return updated;
    } catch (error) {
      if (input.cloudinaryPublicId && input.cloudinaryPublicId !== dish.cloudinaryPublicId) {
        await this.cloudinary.destroyImage(input.cloudinaryPublicId).catch(() => undefined);
      }
      throw error;
    }
  }

  async deletePrivate(userId: string, dishId: string) {
    await this.requireOwnedPrivateDish(userId, dishId);
    return this.prisma.dish.update({
      where: { id: dishId },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  uploadSignature() {
    return this.cloudinary.getUploadSignature();
  }

  async listSharedForUser(userId: string) {
    const dishes = await this.prisma.dish.findMany({
      where: {
        scope: DishScope.SHARED,
        isActive: true,
        deletedAt: null,
      },
      include: { exclusions: { where: { userId }, select: { id: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return dishes.map(({ exclusions, ...dish }) => ({ ...dish, isExcluded: exclusions.length > 0 }));
  }

  async copyShared(userId: string, dishId: string) {
    const dish = await this.prisma.dish.findUnique({ where: { id: dishId } });
    if (!dish || dish.scope !== DishScope.SHARED || !dish.isActive || dish.deletedAt) {
      throw new NotFoundException('Không tìm thấy món dùng chung');
    }
    return this.prisma.dish.create({
      data: {
        scope: DishScope.PRIVATE,
        ownerId: userId,
        name: dish.name,
        shortDescription: dish.shortDescription,
        imageUrl: dish.imageUrl,
        cloudinaryPublicId: dish.cloudinaryPublicId,
      },
    });
  }

  async excludeShared(userId: string, dishId: string) {
    await this.requireSharedDish(dishId);
    return this.prisma.personalExclusion.upsert({
      where: { userId_dishId: { userId, dishId } },
      create: { userId, dishId },
      update: {},
    });
  }

  async unexcludeShared(userId: string, dishId: string) {
    await this.requireSharedDish(dishId);
    return this.prisma.personalExclusion.deleteMany({ where: { userId, dishId } });
  }

  private async requireOwnedPrivateDish(userId: string, dishId: string) {
    const dish = await this.prisma.dish.findUnique({ where: { id: dishId } });
    if (!dish) {
      throw new NotFoundException('Không tìm thấy món ăn');
    }
    if (dish.scope !== DishScope.PRIVATE || dish.ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền với món ăn này');
    }
    return dish;
  }

  private async requireSharedDish(dishId: string) {
    const dish = await this.prisma.dish.findUnique({ where: { id: dishId } });
    if (!dish || dish.scope !== DishScope.SHARED || !dish.isActive || dish.deletedAt) {
      throw new NotFoundException('Không tìm thấy món dùng chung');
    }
    return dish;
  }
}
