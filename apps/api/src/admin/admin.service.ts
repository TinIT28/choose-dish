import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { DishScope, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth.types';
import type { CreateDishInput, UpdateDishInput } from '../dishes/dishes.types';
import { CloudinaryService } from '../storage/cloudinary.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly cloudinary?: CloudinaryService,
  ) {}

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

  listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, role: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  createShared(input: CreateDishInput) {
    this.assertManagedImage(input.imageUrl);
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
    if (input.imageUrl) this.assertManagedImage(input.imageUrl);
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

  private assertManagedImage(imageUrl: string) {
    if (this.cloudinary && !this.cloudinary.isManagedImageUrl(imageUrl)) {
      throw new BadRequestException('Ảnh món ăn phải nằm trên Cloudinary đã cấu hình');
    }
  }
}
