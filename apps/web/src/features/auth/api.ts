import type { AuthResponse, OkResponse } from '@choose-dish/contract';
import { http } from '../../lib/http';

export type { AuthResponse, PublicUser } from '@choose-dish/contract';

export function registerRequest(email: string, password: string) {
  return http.post<AuthResponse>('/auth/register', { email, password });
}

export function loginRequest(email: string, password: string) {
  return http.post<AuthResponse>('/auth/login', { email, password });
}

export function refreshRequest() {
  return http.post<AuthResponse>('/auth/refresh');
}

export function logoutRequest() {
  return http.post<OkResponse>('/auth/logout');
}

export function logoutAllRequest() {
  return http.post<OkResponse>('/auth/logout-all');
}
