import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { AppHeader } from './AppHeader';

afterEach(() => cleanup());

describe('AppHeader', () => {
  it('shows the main navigation and account identity', () => {
    render(
      <MemoryRouter>
        <AppHeader user={{ email: 'an@example.com' }} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Choose Dish' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Hôm nay' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Hôm nay' })).toHaveClass('px-3', 'py-2');
    expect(screen.getByRole('link', { name: 'Kho món' })).toHaveAttribute('href', '/dishes');
    expect(screen.getByRole('link', { name: 'Kho món' })).toHaveClass('px-3', 'py-2');
    expect(screen.getByRole('link', { name: 'Lịch sử' })).toHaveAttribute('href', '/history');
    expect(screen.getByRole('link', { name: 'Lịch sử' })).toHaveClass('px-3', 'py-2');
    expect(screen.getByText('an@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Tài khoản an@example.com')).toBeInTheDocument();
    expect(screen.getByText('AN')).toBeInTheDocument();
  });

  it('offers sign in when there is no active account', () => {
    render(
      <MemoryRouter>
        <AppHeader user={null} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
  });

  it('opens the mobile navigation in a sheet and closes it after navigation', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AppHeader user={{ email: 'an@example.com' }} isAdmin />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Mở menu' }));

    const sheet = screen.getByRole('dialog');
    expect(sheet).toBeInTheDocument();
    expect(within(sheet).getByRole('link', { name: 'Kho món' })).toHaveAttribute('href', '/dishes');
    expect(within(sheet).getByRole('link', { name: 'Quản trị' })).toHaveAttribute('href', '/admin');

    await user.click(within(sheet).getByRole('link', { name: 'Kho món' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
