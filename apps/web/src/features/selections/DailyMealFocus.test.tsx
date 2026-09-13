import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Dish } from '../dishes/api';
import type { Selection } from './api';
import { DailyMealFocus, getCurrentMealPeriod, getNextMealPeriod } from './DailyMealFocus';

const candidates: Dish[] = [
  { id: 'dish-1', name: 'Bún bò Huế', shortDescription: 'Cay nhẹ', imageUrl: '/bun-bo.jpg', cloudinaryPublicId: 'bun-bo', isActive: true },
  { id: 'dish-2', name: 'Cơm tấm', shortDescription: 'Sườn nướng', imageUrl: '/com-tam.jpg', cloudinaryPublicId: 'com-tam', isActive: true },
];

const lunchSelection: Selection = {
  id: 'selection-1',
  localDate: '2026-09-13',
  mealPeriod: 'LUNCH',
  dishId: 'dish-1',
  dishNameSnapshot: 'Bún bò Huế',
  selectedAt: '2026-09-13T05:30:00.000Z',
};

describe('DailyMealFocus', () => {
  it('maps local time to the meal period the user is currently choosing', () => {
    expect(getCurrentMealPeriod(new Date('2026-09-13T01:00:00.000Z'), 'Asia/Ho_Chi_Minh')).toBe('BREAKFAST');
    expect(getCurrentMealPeriod(new Date('2026-09-13T05:00:00.000Z'), 'Asia/Ho_Chi_Minh')).toBe('LUNCH');
    expect(getCurrentMealPeriod(new Date('2026-09-13T07:00:00.000Z'), 'Asia/Ho_Chi_Minh')).toBe('LUNCH');
    expect(getCurrentMealPeriod(new Date('2026-09-13T10:00:00.000Z'), 'Asia/Ho_Chi_Minh')).toBe('DINNER');
  });

  it('focuses the next unselected meal in the current time window', () => {
    expect(getNextMealPeriod(new Date('2026-09-13T05:00:00.000Z'), [
      { ...lunchSelection, mealPeriod: 'BREAKFAST' },
    ], 'Asia/Ho_Chi_Minh')).toBe('LUNCH');
  });

  it('keeps one primary random action and opens candidates in a sheet', async () => {
    const user = userEvent.setup();
    const onRandom = vi.fn();

    render(
      <DailyMealFocus
        mealPeriod="LUNCH"
        timezone="Asia/Ho_Chi_Minh"
        candidates={candidates}
        onRandom={onRandom}
      />,
    );

    expect(screen.getByText('Bữa hiện tại')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bữa trưa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn món ngẫu nhiên cho Bữa trưa' })).toBeInTheDocument();
    expect(screen.queryByText('Cơm tấm')).toBeNull();

    await user.click(screen.getByRole('button', { name: /Xem danh sách món/ }));

    expect(screen.getByRole('dialog', { name: 'Danh sách món cho Bữa trưa' })).toBeInTheDocument();
    expect(screen.getByText('Cơm tấm')).toBeVisible();
  });

  it('shows the selected dish and changes the action to choose again', () => {
    render(
      <DailyMealFocus
        mealPeriod="LUNCH"
        timezone="Asia/Ho_Chi_Minh"
        selection={lunchSelection}
        candidates={candidates}
        onRandom={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Bún bò Huế').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Đổi món cho Bữa trưa' })).toBeInTheDocument();
  });

  it('explains when all meals for the day are already selected', () => {
    render(
      <DailyMealFocus
        mealPeriod="DINNER"
        timezone="Asia/Ho_Chi_Minh"
        selection={{ ...lunchSelection, mealPeriod: 'DINNER' }}
        candidates={candidates}
        isDayComplete
        onRandom={vi.fn()}
      />,
    );

    expect(screen.getByText('Đã đủ món hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Bạn đã có món cho cả ba bữa.')).toBeInTheDocument();
  });
});
