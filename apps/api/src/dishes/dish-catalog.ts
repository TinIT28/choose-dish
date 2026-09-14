import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateDishInput, DishView, SharedDishView } from '@choose-dish/contract';
import { Dish, DishScope, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';

/**
 * Keeps ownership, scope and the soft-delete bookkeeping out of every response.
 * A caller already knows whether it asked for private or shared dishes.
 */
export function toDishView(dish: Dish): DishView {
  return {
    id: dish.id,
    name: dish.name,
    shortDescription: dish.shortDescription,
    imageUrl: dish.imageUrl,
    cloudinaryPublicId: dish.cloudinaryPublicId,
    isActive: dish.isActive,
  };
}

/** A dish is in the catalog while it is active and has not been removed. */
const live = { isActive: true, deletedAt: null } satisfies Prisma.DishWhereInput;

const newestFirst = { createdAt: 'desc' } satisfies Prisma.DishOrderByWithRelationInput;

/**
 * Owns what a Dish is and who can see it.
 *
 * Before this module the rule was restated five times across three services, and
 * personal exclusion had two unrelated encodings — an `exclusions` join in the
 * dishes service and a `none:` filter in the selections service — that nothing
 * forced to agree. Both readers now go through `listSharedFor`.
 */
@Injectable()
export class DishCatalog {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /** The private dishes of one user. */
  async listPrivate(userId: string): Promise<DishView[]> {
    const dishes = await this.privateRows(userId);
    return dishes.map(toDishView);
  }

  /** The shared catalog as an administrator sees it, with no per-user view applied. */
  async listShared(): Promise<DishView[]> {
    const dishes = await this.prisma.dish.findMany({ where: { ...live, scope: DishScope.SHARED }, orderBy: newestFirst });
    return dishes.map(toDishView);
  }

  /** The shared catalog as one user sees it, carrying that user's personal exclusions. */
  async listSharedFor(userId: string): Promise<SharedDishView[]> {
    const shared = await this.sharedWithExclusions(userId);
    return shared.map(({ dish, isExcluded }) => ({ ...toDishView(dish), isExcluded }));
  }

  /**
   * Everything a user can be offered. Returns rows rather than views because the
   * only caller records a name snapshot against the dish it picked.
   */
  async listSelectable(userId: string): Promise<Dish[]> {
    const [privateDishes, shared] = await Promise.all([this.privateRows(userId), this.sharedWithExclusions(userId)]);
    return [...privateDishes, ...shared.filter((entry) => !entry.isExcluded).map((entry) => entry.dish)];
  }

  private privateRows(userId: string) {
    return this.prisma.dish.findMany({
      where: { ...live, scope: DishScope.PRIVATE, ownerId: userId },
      orderBy: newestFirst,
    });
  }

  /** The one place a personal exclusion is resolved, so every reader agrees on it. */
  private async sharedWithExclusions(userId: string) {
    const dishes = await this.prisma.dish.findMany({
      where: { ...live, scope: DishScope.SHARED },
      include: { exclusions: { where: { userId }, select: { id: true } } },
      orderBy: newestFirst,
    });
    return dishes.map(({ exclusions, ...dish }) => ({ dish, isExcluded: exclusions.length > 0 }));
  }

  async requireOwnedPrivate(userId: string, dishId: string) {
    const dish = await this.prisma.dish.findUnique({ where: { id: dishId } });
    if (!dish) {
      throw new NotFoundException('Không tìm thấy món ăn');
    }
    if (dish.scope !== DishScope.PRIVATE || dish.ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền với món ăn này');
    }
    return dish;
  }

  async requireShared(dishId: string) {
    const dish = await this.prisma.dish.findUnique({ where: { id: dishId } });
    if (!dish || dish.scope !== DishScope.SHARED || !dish.isActive || dish.deletedAt) {
      throw new NotFoundException('Không tìm thấy món dùng chung');
    }
    return dish;
  }

  /** Takes a dish out of every reader while keeping the row that selections point at. */
  async remove(dishId: string): Promise<DishView> {
    const removed = await this.prisma.dish.update({ where: { id: dishId }, data: { isActive: false, deletedAt: new Date() } });
    return toDishView(removed);
  }

  /** A Dish needs an image, and that image has to be one this deployment can manage. */
  assertUsableImage(input: Partial<CreateDishInput>) {
    if (!input.imageUrl?.trim() || !input.cloudinaryPublicId?.trim()) {
      throw new BadRequestException('Món ăn cần có ảnh và mã Cloudinary');
    }
    if (!this.cloudinary.isManagedImageUrl(input.imageUrl)) {
      throw new BadRequestException('Ảnh món ăn phải nằm trên Cloudinary đã cấu hình');
    }
  }
}
