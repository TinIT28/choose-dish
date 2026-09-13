import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './env';

describe('production environment', () => {
  it('allows local development without production-only secrets', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('reports every required production variable that is missing', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL.*CRON_SECRET/);
  });
});
