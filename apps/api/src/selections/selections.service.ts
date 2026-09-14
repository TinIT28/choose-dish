import { ConflictException, Injectable } from '@nestjs/common';
import type { SelectionView } from '@choose-dish/contract';
import { MealPeriod, Prisma, type Selection } from '@prisma/client';
import { DishCatalog } from '../dishes/dish-catalog';
import { PrismaService } from '../prisma/prisma.service';
import { SelectionCalendar } from './selection-calendar';
import { selectCandidateDish, type RecentSelection } from './selection-rules';

export class NoAvailableDishException extends ConflictException {
  constructor() {
    super({ code: 'NO_AVAILABLE_DISH', message: 'Chưa có món phù hợp để chọn trong lúc này' });
  }
}

/** `selectedAt` crosses the wire as an ISO string, so the view says so. */
export function toSelectionView(selection: Selection): SelectionView {
  return {
    id: selection.id,
    localDate: selection.localDate,
    mealPeriod: selection.mealPeriod,
    dishId: selection.dishId,
    dishNameSnapshot: selection.dishNameSnapshot,
    selectedAt: selection.selectedAt.toISOString(),
  };
}

@Injectable()
export class SelectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: DishCatalog,
    private readonly calendar: SelectionCalendar,
  ) {}

  async selectRandom(userId: string, mealPeriod: MealPeriod, now = new Date()) {
    const { today, noRepeatWindow } = await this.calendar.forUser(userId, now);
    const [dishes, recentSelections] = await Promise.all([
      this.catalog.listSelectable(userId),
      this.prisma.selection.findMany({
        where: { userId, localDate: { in: noRepeatWindow } },
        select: { localDate: true, dishId: true },
      }),
    ]);

    let dishId: string;
    try {
      dishId = selectCandidateDish(dishes, recentSelections as RecentSelection[], noRepeatWindow);
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

    const key = { userId_localDate_mealPeriod: { userId, localDate: today, mealPeriod } };
    try {
      const selection = await this.prisma.selection.upsert({
        where: key,
        update: { dishId, dishNameSnapshot: dish.name, selectedAt: now },
        create: { userId, localDate: today, mealPeriod, dishId, dishNameSnapshot: dish.name, selectedAt: now },
      });
      return toSelectionView(selection);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Another request won the same slot; return whatever it wrote.
        const existing = await this.prisma.selection.findUnique({ where: key });
        if (!existing) throw error;
        return toSelectionView(existing);
      }
      throw error;
    }
  }

  async listToday(userId: string, now = new Date()): Promise<SelectionView[]> {
    const { today } = await this.calendar.forUser(userId, now);
    const selections = await this.prisma.selection.findMany({
      where: { userId, localDate: today },
      orderBy: { selectedAt: 'asc' },
    });
    return selections.map(toSelectionView);
  }
}
