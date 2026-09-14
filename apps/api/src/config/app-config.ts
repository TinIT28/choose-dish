import { normalizeCorsOrigin } from './cors';

const API_PREFIX = 'api/v1';
const DEFAULT_PORT = 3001;

const alwaysRequiredVariables = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;

const productionOnlyVariables = [
  'DATABASE_URL',
  'DIRECT_URL',
  'FRONTEND_ORIGIN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CRON_SECRET',
] as const;

export interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * The single reader of `process.env`. Everything that needs configuration takes
 * an `AppConfig` instead, so a missing variable fails once at boot rather than
 * at the first request that happens to need it.
 */
export class AppConfig {
  readonly apiPrefix = API_PREFIX;

  private constructor(
    readonly nodeEnv: string | undefined,
    readonly runsOnVercel: boolean,
    readonly port: number,
    readonly frontendOrigin: string,
    readonly jwtAccessSecret: string,
    readonly jwtRefreshSecret: string,
    readonly cronSecret: string | undefined,
    readonly cloudinary: CloudinaryCredentials | null,
  ) {}

  get isProduction() {
    return this.nodeEnv === 'production';
  }

  get isProductionLike() {
    return this.isProduction || this.runsOnVercel;
  }

  get isTest() {
    return this.nodeEnv === 'test';
  }

  static fromEnvironment(environment: NodeJS.ProcessEnv = process.env): AppConfig {
    const productionLike = environment.NODE_ENV === 'production' || environment.VERCEL === '1';
    const required = productionLike ? [...productionOnlyVariables, ...alwaysRequiredVariables] : [...alwaysRequiredVariables];
    const missing = required.filter((name) => !environment[name]);
    if (missing.length > 0) {
      throw new Error(`Thiếu biến môi trường bắt buộc: ${missing.join(', ')}`);
    }

    const cloudName = environment.CLOUDINARY_CLOUD_NAME;
    const apiKey = environment.CLOUDINARY_API_KEY;
    const apiSecret = environment.CLOUDINARY_API_SECRET;

    return new AppConfig(
      environment.NODE_ENV,
      environment.VERCEL === '1',
      Number(environment.PORT ?? DEFAULT_PORT),
      normalizeCorsOrigin(environment.FRONTEND_ORIGIN),
      environment.JWT_ACCESS_SECRET!,
      environment.JWT_REFRESH_SECRET!,
      environment.CRON_SECRET,
      cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null,
    );
  }
}

let cachedConfig: AppConfig | undefined;

/** Resolves the process-wide configuration once. Tests build their own with `fromEnvironment`. */
export function appConfig(): AppConfig {
  cachedConfig ??= AppConfig.fromEnvironment();
  return cachedConfig;
}
