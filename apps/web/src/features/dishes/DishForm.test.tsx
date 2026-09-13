import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DishForm } from './DishForm';

describe('DishForm', () => {
  it('requires an image before saving a dish', async () => {
    const user = userEvent.setup();
    render(<DishForm accessToken="access-token" onSaved={vi.fn()} />);

    await user.type(screen.getByLabelText('Tên món'), 'Cơm tấm');
    await user.type(screen.getByLabelText('Mô tả ngắn'), 'Sườn nướng');
    await user.click(screen.getByRole('button', { name: 'Lưu món ăn' }));

    expect(screen.getByText('Hãy chọn một ảnh món ăn')).toBeInTheDocument();
  });
});
