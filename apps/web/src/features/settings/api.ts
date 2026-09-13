import { apiRequest } from '../auth/api';

export interface UserSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: string;
  expiresAt: string;
  createdAt: string;
}

export function updateSettings(accessToken: string, input: { timezone: string; historyRetentionDays: number }) {
  return apiRequest('/users/me/settings', { method: 'PATCH', body: JSON.stringify(input) }, accessToken);
}

export function listSessions(accessToken: string) {
  return apiRequest<UserSession[]>('/users/me/sessions', {}, accessToken);
}

export function revokeSession(accessToken: string, sessionId: string) {
  return apiRequest(`/users/me/sessions/${sessionId}`, { method: 'DELETE' }, accessToken);
}

export function deleteAccount(accessToken: string) {
  return apiRequest<{ ok: true }>('/users/me', { method: 'DELETE' }, accessToken);
}
