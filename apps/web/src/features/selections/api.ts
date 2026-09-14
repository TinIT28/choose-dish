import type { MealPeriod, SelectionView } from '@choose-dish/contract';
import { http } from '../../lib/http';

export type { MealPeriod, SelectionView as Selection } from '@choose-dish/contract';

export const mealPeriodLabels: Record<MealPeriod, { title: string; icon: string; time: string; description: string }> = {
  BREAKFAST: { title: 'Bữa sáng', icon: '☀️', time: '06:00 – 10:30', description: 'Khởi động nhẹ nhàng' },
  LUNCH: { title: 'Bữa trưa', icon: '🍲', time: '10:30 – 14:30', description: 'Nạp năng lượng giữa ngày' },
  DINNER: { title: 'Bữa tối', icon: '🌙', time: '17:00 – 22:00', description: 'Khép lại một ngày ngon miệng' },
};

export function listTodaySelections() {
  return http.get<SelectionView[]>('/selections/today');
}

export function randomSelection(mealPeriod: MealPeriod) {
  return http.post<SelectionView>('/selections/random', { mealPeriod });
}
