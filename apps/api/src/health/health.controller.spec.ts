import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('returns the public application health contract', async () => {
    const service = { check: vi.fn().mockResolvedValue({ status: 'ok', database: 'up' }) };
    const controller = new HealthController(service as unknown as HealthService);

    await expect(controller.getHealth()).resolves.toEqual({ status: 'ok', database: 'up' });
    expect(service.check).toHaveBeenCalledOnce();
  });
});
