import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MealPeriodCard } from './MealPeriodCard';

describe('MealPeriodCard', () => {
  it('shows the snapshot and selection time and lets the user choose again', async () => {
    const onRandom = vi.fn();
    const user = userEvent.setup();
    render(
      <MealPeriodCard
        mealPeriod="LUNCH"
        timezone="Asia/Ho_Chi_Minh"
        selection={{ id: 'selection-1', localDate: '2026-09-13', mealPeriod: 'LUNCH', dishId: 'dish-1', dishNameSnapshot: 'Bún bò Huế', selectedAt: '2026-09-13T05:30:00.000Z' }}
        onRandom={onRandom}
      />,
    );

    expect(screen.getByText('Bún bò Huế')).toBeInTheDocument();
    expect(screen.getByText('Đã chọn lúc 12:30:00')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Chọn lại' }));
    expect(onRandom).toHaveBeenCalledWith('LUNCH');
  });
});
