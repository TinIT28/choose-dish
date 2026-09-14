import type { AdminUserView, CreateDishInput, DishView, OkResponse, SharedDishView, UpdateDishInput, UploadPolicy } from '@choose-dish/contract';
import { ApiError, http } from '../../lib/http';

export type {
  AdminUserView as AdminUser,
  CreateDishInput,
  DishView as Dish,
  SharedDishView as SharedDish,
  UpdateDishInput,
  UploadPolicy,
} from '@choose-dish/contract';

export function listDishes() {
  return http.get<DishView[]>('/dishes');
}

export function listSharedDishes() {
  return http.get<SharedDishView[]>('/dishes/shared');
}

export function copySharedDish(dishId: string) {
  return http.post<DishView>(`/dishes/${dishId}/copy`);
}

export function excludeSharedDish(dishId: string) {
  return http.post<{ id: string }>(`/dishes/${dishId}/exclusion`);
}

export function unexcludeSharedDish(dishId: string) {
  return http.del<{ count: number }>(`/dishes/${dishId}/exclusion`);
}

export function createDish(input: CreateDishInput) {
  return http.post<DishView>('/dishes', input);
}

export function updateDish(dishId: string, input: UpdateDishInput) {
  return http.patch<DishView>(`/dishes/${dishId}`, input);
}

export function deleteDish(dishId: string) {
  return http.del<DishView>(`/dishes/${dishId}`);
}

export function createSharedDish(input: CreateDishInput) {
  return http.post<DishView>('/admin/shared-dishes', input);
}

export function updateSharedDish(dishId: string, input: UpdateDishInput) {
  return http.patch<DishView>(`/admin/shared-dishes/${dishId}`, input);
}

export function deleteSharedDish(dishId: string) {
  return http.del<DishView>(`/admin/shared-dishes/${dishId}`);
}

export function listAdminUsers() {
  return http.get<AdminUserView[]>('/admin/users');
}

export function resetAdminPassword(userId: string, password: string) {
  return http.post<OkResponse>(`/admin/users/${userId}/reset-password`, { password });
}

export function requestUploadSignature() {
  return http.post<UploadPolicy>('/dishes/upload-signature');
}

/**
 * Uploads straight to Cloudinary, so it does not go through `http` — but it
 * fails with the same `ApiError` the rest of the app already knows how to read.
 */
export function uploadImageToCloudinary(policy: UploadPolicy, file: File, onProgress?: (percentage: number) => void) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    if (file.size > policy.maxFileSize) {
      reject(new ApiError(413, 'FILE_TOO_LARGE', `Ảnh tối đa ${Math.round(policy.maxFileSize / (1024 * 1024))} MB`));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', policy.apiKey);
    formData.append('timestamp', String(policy.timestamp));
    formData.append('folder', policy.folder);
    formData.append('allowed_formats', policy.allowedFormats);
    formData.append('signature', policy.signature);

    const request = new XMLHttpRequest();
    request.open('POST', `https://api.cloudinary.com/v1_1/${policy.cloudName}/image/upload`);
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(JSON.parse(request.responseText) as { secure_url: string; public_id: string });
      } else {
        reject(new ApiError(request.status, 'UPLOAD_FAILED', 'Upload ảnh thất bại'));
      }
    });
    request.addEventListener('error', () => reject(new ApiError(0, 'UPLOAD_UNREACHABLE', 'Không thể kết nối tới kho ảnh')));
    request.send(formData);
  });
}
