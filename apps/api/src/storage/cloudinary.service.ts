import { createHash } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';

const DEFAULT_FOLDER = 'choose-dish';

@Injectable()
export class CloudinaryService {
  getUploadSignature() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Image storage chưa được cấu hình');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = DEFAULT_FOLDER;
    const signature = createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest('hex');
    return { cloudName, apiKey, timestamp, folder, signature };
  }
}
