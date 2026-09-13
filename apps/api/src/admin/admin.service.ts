import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DishScope, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth.types';
import type { CreateDishInput, UpdateDishInput } from '../dishes/dishes.types';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAdmin(user: Pick<AuthUser, 'role'>) {
    if (user.role !== Role.ADMIN && user.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ admin mới có quyền thực hiện thao tác này');
    }
  }

  listShared() {
    return this.prisma.dish.findMany({
      where: { scope: DishScope.SHARED, isActive: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  createShared(input: CreateDishInput) {
    return this.prisma.dish.create({
      data: {
        scope: DishScope.SHARED,
        ownerId: null,
        name: input.name.trim(),
        shortDescription: input.shortDescription.trim(),
        imageUrl: input.imageUrl.trim(),
        cloudinaryPublicId: input.cloudinaryPublicId.trim(),
      },
    });
  }

  async updateShared(dishId: string, input: UpdateDishInput) {
    await this.requireShared(dishId);
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

  async deleteShared(dishId: string) {
    await this.requireShared(dishId);
    return this.prisma.dish.update({ where: { id: dishId }, data: { isActive: false, deletedAt: new Date() } });
  }

  async copySharedDish(userId: string, dishId: string) {
    const dish = await this.requireShared(dishId);
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

  async excludeSharedDish(userId: string, dishId: string) {
    await this.requireShared(dishId);
    return this.prisma.personalExclusion.upsert({
      where: { userId_dishId: { userId, dishId } },
      create: { userId, dishId },
      update: {},
    });
  }

  async includeSharedDish(userId: string, dishId: string) {
    await this.requireShared(dishId);
    return this.prisma.personalExclusion.deleteMany({ where: { userId, dishId } });
  }

  async resetPassword(userId: string, password: string) {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    return this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  private async requireShared(dishId: string) {
    const dish = await this.prisma.dish.findUnique({ where: { id: dishId } });
    if (!dish || dish.scope !== DishScope.SHARED || !dish.isActive || dish.deletedAt) {
      throw new NotFoundException('Không tìm thấy món dùng chung');
    }
    return dish;
  }
}
