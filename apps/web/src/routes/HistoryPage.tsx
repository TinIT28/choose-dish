import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../features/auth/AuthProvider';
import { HistoryTimeline } from '../features/history/HistoryTimeline';
import { listHistory } from '../features/history/api';

export function HistoryPage() {
  const { accessToken, user } = useAuth();
  const historyQuery = useQuery({ queryKey: ['history'], queryFn: () => listHistory(accessToken!), enabled: Boolean(accessToken) });

  if (!accessToken || !user) {
    return <main className="mx-auto flex min-h-screen items-center justify-center px-5"><Button asChild><Link to="/login">Đăng nhập để xem lịch sử</Link></Button></main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">Nhật ký</p>
          <h1 className="font-serif text-5xl font-medium tracking-[-0.05em]">Lịch sử chọn món</h1>
          <p className="mt-3 text-sm text-muted-foreground">Hiển thị tối đa {user.historyRetentionDays} ngày gần nhất.</p>
        </div>
        <Button asChild variant="outline"><Link to="/">Trang chủ</Link></Button>
      </header>
      {historyQuery.isPending && <p className="text-muted-foreground">Đang tải lịch sử…</p>}
      {historyQuery.isError && <p role="alert" className="text-red-700">Không thể tải lịch sử.</p>}
      {historyQuery.data && <HistoryTimeline groups={historyQuery.data} timezone={user.timezone} />}
    </main>
  );
}
