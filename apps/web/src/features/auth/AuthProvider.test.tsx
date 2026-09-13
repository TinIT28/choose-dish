import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthProvider';
import { refreshRequest } from './api';

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api');
  return { ...actual, refreshRequest: vi.fn() };
});

function SessionStatus() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p>Đang khôi phục phiên</p>;
  return <p>{user ? `Đã đăng nhập: ${user.email}` : 'Đã đăng xuất'}</p>;
}

const refreshedUser = {
  id: 'user-1',
  email: 'user@example.com',
  role: 'USER',
  timezone: 'Asia/Ho_Chi_Minh',
  historyRetentionDays: 30,
};

describe('AuthProvider', () => {
  afterEach(() => vi.clearAllMocks());

  it('keeps the restored session when StrictMode triggers a duplicate refresh request', async () => {
    vi.mocked(refreshRequest)
      .mockResolvedValueOnce({ user: refreshedUser, accessToken: 'fresh-access-token' })
      .mockRejectedValueOnce(new Error('Refresh token đã bị sử dụng lại'));

    render(
      <StrictMode>
        <AuthProvider>
          <SessionStatus />
        </AuthProvider>
      </StrictMode>,
    );

    expect(await screen.findByText('Đã đăng nhập: user@example.com')).toBeInTheDocument();
    expect(refreshRequest).toHaveBeenCalledTimes(1);
  });
});
