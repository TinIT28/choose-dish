import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DishScope, MealPeriod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getLocalDate, getRecentLocalDates, selectCandidateDish, type RecentSelection } from './selection-rules';

export class NoAvailableDishException extends ConflictException {
  constructor() {
    super({ code: 'NO_AVAILABLE_DISH', message: 'Chưa có món phù hợp để chọn trong lúc này' });
  }
}

@Injectable()
export class SelectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async selectRandom(userId: string, mealPeriod: MealPeriod, now = new Date()) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    const localDate = getLocalDate(now, user.timezone);
    const recentDates = getRecentLocalDates(localDate);
    const [dishes, recentSelections] = await Promise.all([
      this.prisma.dish.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          OR: [
            { scope: DishScope.PRIVATE, ownerId: userId },
            { scope: DishScope.SHARED, exclusions: { none: { userId } } },
          ],
        },
        select: { id: true, name: true },
      }),
      this.prisma.selection.findMany({
        where: { userId, localDate: { in: recentDates } },
        select: { localDate: true, dishId: true },
      }),
    ]);

    let dishId: string;
    try {
      dishId = selectCandidateDish(dishes, recentSelections as RecentSelection[], localDate);
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_AVAILABLE_DISH') {
        throw new NoAvailableDishException();
      }
      throw error;
    }

    const dish = dishes.find((candidate) => candidate.id === dishId);
    if (!dish) {
      throw new NoAvailableDishException();
    }

    return this.prisma.selection.upsert({
      where: { userId_localDate_mealPeriod: { userId, localDate, mealPeriod } },
      update: { dishId, dishNameSnapshot: dish.name, selectedAt: now },
      create: { userId, localDate, mealPeriod, dishId, dishNameSnapshot: dish.name, selectedAt: now },
    });
  }

  async listToday(userId: string, now = new Date()) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }
    return this.prisma.selection.findMany({
      where: { userId, localDate: getLocalDate(now, user.timezone) },
      orderBy: { selectedAt: 'asc' },
    });
  }
}
