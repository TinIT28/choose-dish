import { describe, expect, it } from 'vitest';
import { normalizeCorsOrigin } from './cors';

describe('normalizeCorsOrigin', () => {
  it('removes trailing slashes so the origin matches browser preflight requests', () => {
    expect(normalizeCorsOrigin('https://choose-dish-web.vercel.app/')).toBe('https://choose-dish-web.vercel.app');
  });
});
