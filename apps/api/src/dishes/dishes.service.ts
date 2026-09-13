import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DishScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import type { CreateDishInput, UpdateDishInput } from './dishes.types';

function validateImageFields(input: Partial<CreateDishInput>) {
  if (!input.imageUrl?.trim() || !input.cloudinaryPublicId?.trim()) {
    throw new BadRequestException('Món ăn cần có ảnh và mã Cloudinary');
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
    validateImageFields(input);
    return this.prisma.dish.create({
      data: {
        scope: DishScope.PRIVATE,
        ownerId: userId,
        name: input.name.trim(),
        shortDescription: input.shortDescription.trim(),
        imageUrl: input.imageUrl.trim(),
        cloudinaryPublicId: input.cloudinaryPublicId.trim(),
      },
    });
  }

  async updatePrivate(userId: string, dishId: string, input: UpdateDishInput) {
    const dish = await this.requireOwnedPrivateDish(userId, dishId);
    if (input.imageUrl !== undefined || input.cloudinaryPublicId !== undefined) {
      validateImageFields({ imageUrl: input.imageUrl ?? dish.imageUrl, cloudinaryPublicId: input.cloudinaryPublicId ?? dish.cloudinaryPublicId });
    }

    return this.prisma.dish.update({
      where: { id: dishId },
      data: {
        ...(input.name === undefined ? {} : { name: input.name.trim() }),
        ...(input.shortDescription === undefined ? {} : { shortDescription: input.shortDescription.trim() }),
        ...(input.imageUrl === undefined ? {} : { imageUrl: input.imageUrl.trim() }),
        ...(input.cloudinaryPublicId === undefined ? {} : { cloudinaryPublicId: input.cloudinaryPublicId.trim() }),
      },
    });
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

  listSharedForUser(userId: string) {
    return this.prisma.dish.findMany({
      where: {
        scope: DishScope.SHARED,
        isActive: true,
        deletedAt: null,
        exclusions: { none: { userId } },
      },
      orderBy: { createdAt: 'desc' },
    });
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
