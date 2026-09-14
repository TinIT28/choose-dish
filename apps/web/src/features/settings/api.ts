import type { OkResponse, PublicUser, UserSessionView, UserSettingsInput } from '@choose-dish/contract';
import { http } from '../../lib/http';

export type { UserSessionView as UserSession, UserSettingsInput } from '@choose-dish/contract';

export function updateSettings(input: UserSettingsInput) {
  return http.patch<PublicUser>('/users/me/settings', input);
}

export function listSessions() {
  return http.get<UserSessionView[]>('/users/me/sessions');
}

export function revokeSession(sessionId: string) {
  return http.del(`/users/me/sessions/${sessionId}`);
}

export function deleteAccount() {
  return http.del<OkResponse>('/users/me');
}
