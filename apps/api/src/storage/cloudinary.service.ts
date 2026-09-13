import { createHash } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';

const DEFAULT_FOLDER = 'choose-dish';
const ALLOWED_FORMATS = 'jpg,png,webp';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class CloudinaryService {
  isManagedImageUrl(imageUrl: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return false;
    try {
      const url = new URL(imageUrl);
      return url.hostname === 'res.cloudinary.com' && url.pathname.startsWith(`/${cloudName}/`);
    } catch {
      return false;
    }
  }

  getUploadSignature() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Image storage chưa được cấu hình');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = DEFAULT_FOLDER;
    const signature = createHash('sha1')
      .update(`allowed_formats=${ALLOWED_FORMATS}&folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');
    return { cloudName, apiKey, timestamp, folder, allowedFormats: ALLOWED_FORMATS, maxFileSize: MAX_FILE_SIZE, signature };
  }

  async destroyImage(publicId: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest('hex');
    const body = new URLSearchParams({ public_id: publicId, api_key: apiKey, timestamp: String(timestamp), signature });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: 'POST', body });
    if (!response.ok) {
      throw new Error('Cloudinary image cleanup failed');
    }
  }
}
