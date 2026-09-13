import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CloudinaryService } from './cloudinary.service';

describe('CloudinaryService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1_789_308_579_000));
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'choose-dish-test');
    vi.stubEnv('CLOUDINARY_API_KEY', 'test-api-key');
    vi.stubEnv('CLOUDINARY_API_SECRET', 'test-api-secret');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('signs only the fields Cloudinary includes in a direct signed upload', () => {
    const result = new CloudinaryService().getUploadSignature();
    const expected = createHash('sha1')
      .update('allowed_formats=jpg,png,webp&folder=choose-dish&timestamp=1789308579test-api-secret')
      .digest('hex');

    expect(result.signature).toBe(expected);
  });
});
