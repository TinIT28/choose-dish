import { IsEnum } from 'class-validator';
import { MealPeriod } from '@prisma/client';

export class RandomSelectionDto {
  @IsEnum(MealPeriod)
  mealPeriod!: MealPeriod;
}
