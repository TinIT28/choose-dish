import { describe, expect, it } from 'vitest';
import { AppConfig } from './app-config';

const developmentEnvironment = {
  NODE_ENV: 'development',
  JWT_ACCESS_SECRET: 'dev-access-secret',
  JWT_REFRESH_SECRET: 'dev-refresh-secret',
};

const productionEnvironment = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://localhost/choose-dish',
  DIRECT_URL: 'postgresql://localhost/choose-dish',
  JWT_ACCESS_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
  FRONTEND_ORIGIN: 'https://choose-dish.example.com',
  CLOUDINARY_CLOUD_NAME: 'choose-dish',
  CLOUDINARY_API_KEY: 'api-key',
  CLOUDINARY_API_SECRET: 'api-secret',
  CRON_SECRET: 'cron-secret',
};

describe('AppConfig', () => {
  it('reports every missing production variable in a single error', () => {
    expect(() => AppConfig.fromEnvironment({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL.*CRON_SECRET/);
  });

  it('treats a Vercel deployment as production-like even without NODE_ENV', () => {
    expect(() => AppConfig.fromEnvironment({ VERCEL: '1' })).toThrow(/DATABASE_URL/);
    expect(AppConfig.fromEnvironment({ ...productionEnvironment, NODE_ENV: undefined, VERCEL: '1' }).isProductionLike).toBe(true);
  });

  it('requires the JWT secrets in every environment so a missing one fails at boot', () => {
    expect(() => AppConfig.fromEnvironment({ NODE_ENV: 'development' })).toThrow(/JWT_ACCESS_SECRET.*JWT_REFRESH_SECRET/);
  });

  it('runs in development without image storage or cron configuration', () => {
    const config = AppConfig.fromEnvironment(developmentEnvironment);

    expect(config.cloudinary).toBeNull();
    expect(config.cronSecret).toBeUndefined();
    expect(config.isProductionLike).toBe(false);
  });

  it('falls back to the local frontend origin and port', () => {
    const config = AppConfig.fromEnvironment(developmentEnvironment);

    expect(config.frontendOrigin).toBe('http://localhost:3000');
    expect(config.port).toBe(3001);
  });

  it('strips the trailing slash from the configured frontend origin', () => {
    const config = AppConfig.fromEnvironment({ ...productionEnvironment, FRONTEND_ORIGIN: 'https://choose-dish.example.com/' });

    expect(config.frontendOrigin).toBe('https://choose-dish.example.com');
  });

  it('exposes image storage credentials as one value so every reader shares a failure mode', () => {
    const config = AppConfig.fromEnvironment(productionEnvironment);

    expect(config.cloudinary).toEqual({ cloudName: 'choose-dish', apiKey: 'api-key', apiSecret: 'api-secret' });
  });

  it('ignores partially configured image storage', () => {
    const config = AppConfig.fromEnvironment({ ...developmentEnvironment, CLOUDINARY_CLOUD_NAME: 'choose-dish' });

    expect(config.cloudinary).toBeNull();
  });

  it('owns the API prefix that the refresh cookie path depends on', () => {
    expect(AppConfig.fromEnvironment(developmentEnvironment).apiPrefix).toBe('api/v1');
  });
});
