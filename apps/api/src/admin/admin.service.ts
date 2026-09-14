import { Injectable } from '@nestjs/common';
import type { AdminUserView, CreateDishInput, UpdateDishInput } from '@choose-dish/contract';
import { DishScope } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { DishCatalog, toDishView } from '../dishes/dish-catalog';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: DishCatalog,
  ) {}

  listShared() {
    return this.catalog.listShared();
  }

  listUsers(): Promise<AdminUserView[]> {
    return this.prisma.user.findMany({
      select: { id: true, email: true, role: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createShared(input: CreateDishInput) {
    this.catalog.assertUsableImage(input);
    const created = await this.prisma.dish.create({
      data: {
        scope: DishScope.SHARED,
        ownerId: null,
        name: input.name.trim(),
        shortDescription: input.shortDescription.trim(),
        imageUrl: input.imageUrl.trim(),
        cloudinaryPublicId: input.cloudinaryPublicId.trim(),
      },
    });
    return toDishView(created);
  }

  async updateShared(dishId: string, input: UpdateDishInput) {
    const dish = await this.catalog.requireShared(dishId);
    if (input.imageUrl !== undefined || input.cloudinaryPublicId !== undefined) {
      this.catalog.assertUsableImage({
        imageUrl: input.imageUrl ?? dish.imageUrl,
        cloudinaryPublicId: input.cloudinaryPublicId ?? dish.cloudinaryPublicId,
      });
    }
    const updated = await this.prisma.dish.update({
      where: { id: dishId },
      data: {
        ...(input.name === undefined ? {} : { name: input.name.trim() }),
        ...(input.shortDescription === undefined ? {} : { shortDescription: input.shortDescription.trim() }),
        ...(input.imageUrl === undefined ? {} : { imageUrl: input.imageUrl.trim() }),
        ...(input.cloudinaryPublicId === undefined ? {} : { cloudinaryPublicId: input.cloudinaryPublicId.trim() }),
      },
    });
    return toDishView(updated);
  }

  async deleteShared(dishId: string) {
    await this.catalog.requireShared(dishId);
    return this.catalog.remove(dishId);
  }

  async resetPassword(userId: string, password: string) {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    return this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}
