import { apiRequest } from '../auth/api';
import type { MealPeriod } from '../selections/api';

export interface HistorySelection {
  id: string;
  localDate: string;
  mealPeriod: MealPeriod;
  dishNameSnapshot: string;
  selectedAt: string;
}

export interface HistoryGroup {
  localDate: string;
  selections: HistorySelection[];
}

export function listHistory(accessToken: string) {
  return apiRequest<HistoryGroup[]>('/history', {}, accessToken);
}
