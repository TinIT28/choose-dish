import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { listSessions, revokeSession } from './api';

export function SessionList({ accessToken }: { accessToken: string }) {
  const queryClient = useQueryClient();
  const sessionsQuery = useQuery({ queryKey: ['sessions'], queryFn: () => listSessions(accessToken) });
  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => revokeSession(accessToken, sessionId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  return (
    <div className="space-y-3">
      {sessionsQuery.isPending && <p className="text-sm text-muted-foreground">Đang tải các thiết bị…</p>}
      {sessionsQuery.data?.map((session) => (
        <Card key={session.id}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{session.userAgent ?? 'Thiết bị không xác định'}</p>
              <p className="text-xs text-muted-foreground">Hoạt động lần cuối: {new Date(session.lastUsedAt).toLocaleString('vi-VN')}</p>
            </div>
            <Button variant="outline" size="sm" disabled={revokeMutation.isPending} onClick={() => revokeMutation.mutate(session.id)}>
              Thu hồi
            </Button>
          </CardContent>
        </Card>
      ))}
      {sessionsQuery.data?.length === 0 && <p className="text-sm text-muted-foreground">Không còn phiên đăng nhập nào.</p>}
    </div>
  );
}
