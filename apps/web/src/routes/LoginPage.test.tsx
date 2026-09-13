import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../features/auth/AuthProvider';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows accessible validation messages before submitting invalid credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ message: 'Unauthorized' }) }),
    );
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(screen.getByText('Email chưa đúng định dạng')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu cần ít nhất 8 ký tự')).toBeInTheDocument();
  });
});
