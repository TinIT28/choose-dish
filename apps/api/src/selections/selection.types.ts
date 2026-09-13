import type { MealPeriod } from '@prisma/client';

export interface SelectionView {
  id: string;
  localDate: string;
  mealPeriod: MealPeriod | string;
  dishId: string;
  dishNameSnapshot: string;
  selectedAt: Date;
}
