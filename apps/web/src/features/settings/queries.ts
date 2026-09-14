import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserSettingsInput } from '@choose-dish/contract';
import { queryKeys } from '../queryKeys';
import { deleteAccount, listSessions, revokeSession, updateSettings } from './api';

export function useSessionsQuery(userId: string) {
  return useQuery({ queryKey: queryKeys.sessions(userId), queryFn: listSessions });
}

export function useRevokeSessionMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions(userId) }),
  });
}

export function useUpdateSettingsMutation(userId: string, onSaved: () => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UserSettingsInput) => updateSettings(input),
    onSuccess: async () => {
      await onSaved();
      // Retention is part of the settings, so the history window may have moved.
      await queryClient.invalidateQueries({ queryKey: queryKeys.history(userId) });
    },
  });
}

export function useDeleteAccountMutation(onDeleted: () => void) {
  return useMutation({ mutationFn: deleteAccount, onSuccess: onDeleted });
}
