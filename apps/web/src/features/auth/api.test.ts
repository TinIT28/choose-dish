import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './api';

describe('resolveApiBaseUrl', () => {
  it('uses the public Vercel config variable for production builds', () => {
    expect(
      resolveApiBaseUrl({
        MODE: 'production',
        VITE_PUBLIC_API_BASE_URL: 'https://choose-dish-api.vercel.app/api/v1',
      }),
    ).toBe('https://choose-dish-api.vercel.app/api/v1');
  });
});
