import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Dish } from '../dishes/api';
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

  it('shows dish candidates and exposes the randomizing state', () => {
    const candidates: Dish[] = [
      { id: 'dish-1', name: 'Bún bò Huế', shortDescription: 'Cay nhẹ', imageUrl: '/bun-bo.jpg', cloudinaryPublicId: 'bun-bo', isActive: true },
      { id: 'dish-2', name: 'Cơm tấm', shortDescription: 'Sườn nướng', imageUrl: '/com-tam.jpg', cloudinaryPublicId: 'com-tam', isActive: true },
    ];

    render(
      <MealPeriodCard
        mealPeriod="LUNCH"
        timezone="Asia/Ho_Chi_Minh"
        candidates={candidates}
        isLoading
        onRandom={vi.fn()}
      />,
    );

    expect(screen.getByRole('list', { name: 'Các món có thể chọn cho Bữa trưa' })).toBeInTheDocument();
    expect(screen.getAllByText('Bún bò Huế').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cơm tấm').length).toBeGreaterThan(0);
    expect(screen.getByRole('status')).toHaveTextContent('Đang xáo trộn món');
  });

  it('highlights the meal period that matches the current time', () => {
    render(
      <MealPeriodCard
        mealPeriod="LUNCH"
        timezone="Asia/Ho_Chi_Minh"
        isCurrent
        candidates={[]}
        onRandom={vi.fn()}
      />,
    );

    expect(screen.getByText('Đang chọn')).toBeInTheDocument();
  });
});
