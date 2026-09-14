import { describe, expect, it } from 'vitest';
import type { Dish, SharedDish } from '../dishes/api';
import type { Selection } from './api';
import { buildSelectionDay, getCurrentMealPeriod } from './selection-day';

const timezone = 'Asia/Ho_Chi_Minh';
const lunchtime = new Date('2026-09-13T05:00:00.000Z');

function dish(id: string, name: string): Dish {
  return { id, name, shortDescription: 'Mô tả', imageUrl: `/${id}.jpg`, cloudinaryPublicId: id, isActive: true };
}

function shared(id: string, name: string, isExcluded = false): SharedDish {
  return { ...dish(id, name), isExcluded };
}

function selection(mealPeriod: Selection['mealPeriod'], dishId: string): Selection {
  return {
    id: `selection-${mealPeriod}`,
    localDate: '2026-09-13',
    mealPeriod,
    dishId,
    dishNameSnapshot: dishId,
    selectedAt: '2026-09-13T05:00:00.000Z',
  };
}

describe('getCurrentMealPeriod', () => {
  it('maps local time to the meal the user is in', () => {
    expect(getCurrentMealPeriod(new Date('2026-09-13T01:00:00.000Z'), timezone)).toBe('BREAKFAST');
    expect(getCurrentMealPeriod(new Date('2026-09-13T05:00:00.000Z'), timezone)).toBe('LUNCH');
    expect(getCurrentMealPeriod(new Date('2026-09-13T07:00:00.000Z'), timezone)).toBe('LUNCH');
    expect(getCurrentMealPeriod(new Date('2026-09-13T10:00:00.000Z'), timezone)).toBe('DINNER');
  });

  it('points at tomorrow breakfast once dinner service is over', () => {
    // 22:30 and 02:00 local in Ho Chi Minh City.
    expect(getCurrentMealPeriod(new Date('2026-09-13T15:30:00.000Z'), timezone)).toBe('BREAKFAST');
    expect(getCurrentMealPeriod(new Date('2026-09-12T19:00:00.000Z'), timezone)).toBe('BREAKFAST');
  });

  it('carries the gap between meal windows forward to the next meal', () => {
    // 15:00 local: after the lunch window, before the dinner one.
    expect(getCurrentMealPeriod(new Date('2026-09-13T08:00:00.000Z'), timezone)).toBe('DINNER');
  });
});

describe('buildSelectionDay', () => {
  it('lets a private dish win over a shared dish with the same id', () => {
    const day = buildSelectionDay({
      privateDishes: [dish('dish-1', 'Bản riêng')],
      sharedDishes: [shared('dish-1', 'Bản dùng chung')],
      now: lunchtime,
    });

    expect(day.candidates).toEqual([expect.objectContaining({ id: 'dish-1', name: 'Bản riêng' })]);
  });

  it('drops the shared dishes the user excluded and keeps the rest', () => {
    const day = buildSelectionDay({
      privateDishes: [dish('mine', 'Cơm tấm')],
      sharedDishes: [shared('kept', 'Bánh mì'), shared('hidden', 'Lòng lợn', true)],
      now: lunchtime,
    });

    expect(day.candidates.map((candidate) => candidate.id)).toEqual(['mine', 'kept']);
  });

  it('indexes the selections by meal period so every layout reads one lookup', () => {
    const day = buildSelectionDay({ selections: [selection('LUNCH', 'dish-1')], now: lunchtime });

    expect(day.byMealPeriod.LUNCH).toMatchObject({ dishId: 'dish-1' });
    expect(day.byMealPeriod.BREAKFAST).toBeUndefined();
    expect(day.byMealPeriod.DINNER).toBeUndefined();
  });

  it('keeps the focus on the meal the clock is in, so it can be chosen again', () => {
    const day = buildSelectionDay({ selections: [selection('LUNCH', 'dish-1')], now: lunchtime });

    expect(day.focusMealPeriod).toBe('LUNCH');
    expect(day.focusSelection).toMatchObject({ dishId: 'dish-1' });
  });

  it('counts progress and reports a finished day', () => {
    const everyMeal = [selection('BREAKFAST', 'a'), selection('LUNCH', 'b'), selection('DINNER', 'c')];

    const partial = buildSelectionDay({ selections: [selection('LUNCH', 'b')], now: lunchtime });
    const complete = buildSelectionDay({ selections: everyMeal, now: lunchtime });

    expect(partial).toMatchObject({ completedMeals: 1, isDayComplete: false });
    expect(complete).toMatchObject({ completedMeals: 3, isDayComplete: true, focusMealPeriod: 'DINNER' });
  });

  it('falls back to the default timezone until the account reports one', () => {
    expect(buildSelectionDay({ now: lunchtime }).timezone).toBe('Asia/Ho_Chi_Minh');
    expect(buildSelectionDay({ timezone: 'Europe/Paris', now: lunchtime }).timezone).toBe('Europe/Paris');
  });

  it('reads the focus meal in the timezone of the account', () => {
    const instant = new Date('2026-09-13T05:00:00.000Z');

    expect(buildSelectionDay({ timezone: 'Asia/Ho_Chi_Minh', now: instant }).focusMealPeriod).toBe('LUNCH');
    expect(buildSelectionDay({ timezone: 'Europe/Paris', now: instant }).focusMealPeriod).toBe('BREAKFAST');
  });
});
