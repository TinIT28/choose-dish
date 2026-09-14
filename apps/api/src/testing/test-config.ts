import { AppConfig } from '../config/app-config';
import { CloudinaryService } from '../storage/cloudinary.service';

export const TEST_CLOUD_NAME = 'choose-dish';
export const MANAGED_IMAGE_URL = `https://res.cloudinary.com/${TEST_CLOUD_NAME}/image/upload/v1/managed.jpg`;
export const UNMANAGED_IMAGE_URL = 'https://images.example.com/unmanaged.jpg';

export function makeAppConfig(overrides: NodeJS.ProcessEnv = {}) {
  return AppConfig.fromEnvironment({
    NODE_ENV: 'test',
    JWT_ACCESS_SECRET: 'test-access-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    CLOUDINARY_CLOUD_NAME: TEST_CLOUD_NAME,
    CLOUDINARY_API_KEY: 'test-api-key',
    CLOUDINARY_API_SECRET: 'test-api-secret',
    ...overrides,
  });
}

/** A real CloudinaryService wired to test credentials, so the managed-image branch actually runs. */
export function makeCloudinaryService(overrides: NodeJS.ProcessEnv = {}) {
  return new CloudinaryService(makeAppConfig(overrides));
}
