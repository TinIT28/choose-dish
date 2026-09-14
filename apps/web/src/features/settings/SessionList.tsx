import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useRevokeSessionMutation, useSessionsQuery } from './queries';

export function SessionList({ userId }: { userId: string }) {
  const sessionsQuery = useSessionsQuery(userId);
  const revokeMutation = useRevokeSessionMutation(userId);

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
