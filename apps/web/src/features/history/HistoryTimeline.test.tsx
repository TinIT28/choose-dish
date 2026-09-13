import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HistoryTimeline } from './HistoryTimeline';

describe('HistoryTimeline', () => {
  it('renders snapshots grouped by local date with exact local time', () => {
    render(
      <HistoryTimeline
        timezone="Asia/Ho_Chi_Minh"
        groups={[{ localDate: '2026-09-13', selections: [{ id: 'selection-1', localDate: '2026-09-13', mealPeriod: 'LUNCH', dishNameSnapshot: 'Cơm tấm', selectedAt: '2026-09-13T05:30:00.000Z' }] }]}
      />,
    );

    expect(screen.getByText('2026-09-13')).toBeInTheDocument();
    expect(screen.getByText('Cơm tấm')).toBeInTheDocument();
    expect(screen.getByText('12:30')).toBeInTheDocument();
  });
});
