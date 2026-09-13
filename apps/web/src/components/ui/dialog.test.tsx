import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './dialog';

describe('Dialog', () => {
  it('opens the content and closes it with the accessible close button', async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Chỉnh sửa</DialogTrigger>
        <DialogContent>
          <DialogTitle>Sửa món</DialogTitle>
          <p>Nội dung form</p>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Chỉnh sửa' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Sửa món');
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
