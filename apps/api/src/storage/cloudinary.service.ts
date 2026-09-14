import { createHash } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { UploadPolicy } from '@choose-dish/contract';
import { AppConfig } from '../config/app-config';

const DEFAULT_FOLDER = 'choose-dish';
const ALLOWED_FORMATS = 'jpg,png,webp';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: AppConfig) {}

  isManagedImageUrl(imageUrl: string) {
    const credentials = this.config.cloudinary;
    if (!credentials) return false;
    try {
      const url = new URL(imageUrl);
      return url.hostname === 'res.cloudinary.com' && url.pathname.startsWith(`/${credentials.cloudName}/`);
    } catch {
      return false;
    }
  }

  getUploadSignature(): UploadPolicy {
    const credentials = this.config.cloudinary;
    if (!credentials) {
      throw new ServiceUnavailableException('Image storage chưa được cấu hình');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = DEFAULT_FOLDER;
    const signature = createHash('sha1')
      .update(`allowed_formats=${ALLOWED_FORMATS}&folder=${folder}&timestamp=${timestamp}${credentials.apiSecret}`)
      .digest('hex');
    return {
      cloudName: credentials.cloudName,
      apiKey: credentials.apiKey,
      timestamp,
      folder,
      allowedFormats: ALLOWED_FORMATS,
      maxFileSize: MAX_FILE_SIZE,
      signature,
    };
  }

  async destroyImage(publicId: string) {
    const credentials = this.config.cloudinary;
    if (!credentials) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}${credentials.apiSecret}`).digest('hex');
    const body = new URLSearchParams({ public_id: publicId, api_key: credentials.apiKey, timestamp: String(timestamp), signature });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/destroy`, { method: 'POST', body });
    if (!response.ok) {
      throw new Error('Cloudinary image cleanup failed');
    }
  }
}
