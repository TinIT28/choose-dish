import { apiRequest } from '../auth/api';

export interface Dish {
  id: string;
  name: string;
  shortDescription: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  isActive: boolean;
}

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export function listDishes(accessToken: string) {
  return apiRequest<Dish[]>('/dishes', {}, accessToken);
}

export function listSharedDishes(accessToken: string) {
  return apiRequest<Dish[]>('/dishes/shared', {}, accessToken);
}

export function copySharedDish(accessToken: string, dishId: string) {
  return apiRequest<Dish>(`/dishes/${dishId}/copy`, { method: 'POST' }, accessToken);
}

export function excludeSharedDish(accessToken: string, dishId: string) {
  return apiRequest<{ id: string }>(`/dishes/${dishId}/exclusion`, { method: 'POST' }, accessToken);
}

export function includeSharedDish(accessToken: string, dishId: string) {
  return apiRequest<{ count: number }>(`/dishes/${dishId}/exclusion`, { method: 'DELETE' }, accessToken);
}

export function createDish(accessToken: string, input: Omit<Dish, 'id' | 'isActive'>) {
  return apiRequest<Dish>('/dishes', { method: 'POST', body: JSON.stringify(input) }, accessToken);
}

export function requestUploadSignature(accessToken: string) {
  return apiRequest<UploadSignature>('/dishes/upload-signature', { method: 'POST' }, accessToken);
}

export function uploadImageToCloudinary(signature: UploadSignature, file: File, onProgress?: (percentage: number) => void) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('folder', signature.folder);
    formData.append('signature', signature.signature);

    const request = new XMLHttpRequest();
    request.open('POST', `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`);
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(JSON.parse(request.responseText) as { secure_url: string; public_id: string });
      } else {
        reject(new Error('Upload ảnh thất bại'));
      }
    });
    request.addEventListener('error', () => reject(new Error('Không thể kết nối tới kho ảnh')));
    request.send(formData);
  });
}
