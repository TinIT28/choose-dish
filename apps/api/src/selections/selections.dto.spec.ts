import { describe, expect, it, vi } from 'vitest';

describe('RandomSelectionDto', () => {
  it('does not require Prisma enum values at module load time', async () => {
    vi.resetModules();
    vi.doMock('@prisma/client', () => ({ MealPeriod: undefined }));

    await expect(import('./selections.dto')).resolves.toBeDefined();

    vi.doUnmock('@prisma/client');
  });
});
