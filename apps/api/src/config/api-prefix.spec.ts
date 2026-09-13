import { describe, expect, it } from 'vitest';
import { getApiPrefix } from './api-prefix';

describe('getApiPrefix', () => {
  it('keeps the /api/v1 prefix for local Express development', () => {
    expect(getApiPrefix(false)).toBe('api/v1');
  });

  it('drops the Vercel function path prefix when running on Vercel', () => {
    expect(getApiPrefix(true)).toBe('v1');
  });
});
