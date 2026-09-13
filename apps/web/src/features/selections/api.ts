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

export const mealPeriodLabels: Record<MealPeriod, { title: string; icon: string; time: string; description: string }> = {
  BREAKFAST: { title: 'Bữa sáng', icon: '☀️', time: '06:00 – 10:30', description: 'Khởi động nhẹ nhàng' },
  LUNCH: { title: 'Bữa trưa', icon: '🍲', time: '10:30 – 14:30', description: 'Nạp năng lượng giữa ngày' },
  DINNER: { title: 'Bữa tối', icon: '🌙', time: '17:00 – 22:00', description: 'Khép lại một ngày ngon miệng' },
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
