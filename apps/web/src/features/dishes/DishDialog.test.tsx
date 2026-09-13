import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DishDialog } from './DishDialog';

const dish = {
  id: 'dish-1',
  name: 'Bún bò Huế',
  shortDescription: 'Nước dùng cay nhẹ',
  imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  cloudinaryPublicId: 'sample',
  isActive: true,
};

describe('DishDialog', () => {
  it('uses the same dialog for creating and editing a dish', () => {
    const { rerender } = render(
      <DishDialog
        open
        accessToken="access-token"
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Thêm món');

    rerender(
      <DishDialog
        open
        accessToken="access-token"
        initialDish={dish}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Sửa món');
    expect(screen.getByDisplayValue('Bún bò Huế')).toBeInTheDocument();
  });
});
