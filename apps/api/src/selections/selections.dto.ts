import { IsIn } from 'class-validator';
import type { MealPeriod } from '@prisma/client';

export const MEAL_PERIOD_VALUES = ['BREAKFAST', 'LUNCH', 'DINNER'] as const satisfies readonly MealPeriod[];

export class RandomSelectionDto {
  @IsIn(MEAL_PERIOD_VALUES)
  mealPeriod!: MealPeriod;
}
