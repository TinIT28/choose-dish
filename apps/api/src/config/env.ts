const requiredProductionVariables = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_ORIGIN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CRON_SECRET',
] as const;

export function validateEnvironment(environment: NodeJS.ProcessEnv = process.env) {
  if (environment.NODE_ENV !== 'production') return;

  const missing = requiredProductionVariables.filter((name) => !environment[name]);
  if (missing.length > 0) {
    throw new Error(`Thiếu biến môi trường production: ${missing.join(', ')}`);
  }
}

export { requiredProductionVariables };
