import { describe, expect, it } from 'vitest';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  it('denies shared-dish management to a normal user', async () => {
    const service = new AdminService({} as never);

    await expect(service.assertAdmin({ role: 'USER' } as never)).rejects.toMatchObject({ status: 403 });
  });
});
