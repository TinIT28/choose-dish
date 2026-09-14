import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppConfig } from '../config/app-config';
import { CloudinaryService } from './cloudinary.service';

const baseEnvironment = {
  NODE_ENV: 'test',
  JWT_ACCESS_SECRET: 'test-access-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
};

function makeService(cloudinaryEnvironment: NodeJS.ProcessEnv = {}) {
  return new CloudinaryService(AppConfig.fromEnvironment({ ...baseEnvironment, ...cloudinaryEnvironment }));
}

const configuredStorage = {
  CLOUDINARY_CLOUD_NAME: 'choose-dish-test',
  CLOUDINARY_API_KEY: 'test-api-key',
  CLOUDINARY_API_SECRET: 'test-api-secret',
};

describe('CloudinaryService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1_789_308_579_000));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('signs only the fields Cloudinary includes in a direct signed upload', () => {
    const result = makeService(configuredStorage).getUploadSignature();
    const expected = createHash('sha1')
      .update('allowed_formats=jpg,png,webp&folder=choose-dish&timestamp=1789308579test-api-secret')
      .digest('hex');

    expect(result.signature).toBe(expected);
  });

  it('refuses to sign an upload when image storage is not configured', () => {
    expect(() => makeService().getUploadSignature()).toThrow(/Image storage/);
  });

  it('accepts only images hosted under the configured cloud', () => {
    const service = makeService(configuredStorage);

    expect(service.isManagedImageUrl('https://res.cloudinary.com/choose-dish-test/image/upload/v1/a.jpg')).toBe(true);
    expect(service.isManagedImageUrl('https://res.cloudinary.com/someone-else/image/upload/v1/a.jpg')).toBe(false);
    expect(service.isManagedImageUrl('https://evil.example.com/a.jpg')).toBe(false);
    expect(service.isManagedImageUrl('not-a-url')).toBe(false);
  });

  it('treats every image as unmanaged when image storage is not configured', () => {
    expect(makeService().isManagedImageUrl('https://res.cloudinary.com/choose-dish-test/image/upload/v1/a.jpg')).toBe(false);
  });
});
