import { describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service';

describe('UsersService', () => {
  it('validates timezone and retention presets before updating settings', async () => {
    const update = vi.fn().mockResolvedValue({});
    const service = new UsersService({ user: { update } } as never);

    await expect(service.updateSettings('user-1', { timezone: 'Not/A_Timezone', historyRetentionDays: 30 })).rejects.toMatchObject({ status: 400 });
    await expect(service.updateSettings('user-1', { timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 14 })).rejects.toMatchObject({ status: 400 });

    await service.updateSettings('user-1', { timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 90 });
    expect(update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 90 } });
  });

  it('refuses to delete the last admin', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'ADMIN' }),
        count: vi.fn().mockResolvedValue(1),
      },
    };
    const service = new UsersService(prisma as never);

    await expect(service.deleteAccount('admin-1')).rejects.toMatchObject({ status: 409 });
  });
});
