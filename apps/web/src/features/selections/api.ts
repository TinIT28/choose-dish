import { apiRequest } from '../auth/api';

export type MealPeriod = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export interface Selection {
  id: string;
  localDate: string;
  mealPeriod: MealPeriod;
  dishId: string;
  dishNameSnapshot: string;
  selectedAt: string;
}

export const mealPeriodLabels: Record<MealPeriod, { title: string; icon: string }> = {
  BREAKFAST: { title: 'Bữa sáng', icon: '☀️' },
  LUNCH: { title: 'Bữa trưa', icon: '🍲' },
  DINNER: { title: 'Bữa tối', icon: '🌙' },
};

export function listTodaySelections(accessToken: string) {
  return apiRequest<Selection[]>('/selections/today', {}, accessToken);
}

export function randomSelection(accessToken: string, mealPeriod: MealPeriod) {
  return apiRequest<Selection>('/selections/random', {
    method: 'POST',
    body: JSON.stringify({ mealPeriod }),
  }, accessToken);
}
