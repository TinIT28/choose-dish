import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/ui/button';
import { useAuth } from '../features/auth/AuthProvider';
import { HistoryTimeline } from '../features/history/HistoryTimeline';
import { useHistoryQuery } from '../features/history/queries';

export function HistoryPage() {
  const { accessToken, user, logout } = useAuth();
  const historyQuery = useHistoryQuery(accessToken, user?.id ?? null);

  if (!accessToken || !user) {
    return <main className="mx-auto flex min-h-screen items-center justify-center px-5"><Button asChild><Link to="/login">Đăng nhập để xem lịch sử</Link></Button></main>;
  }

  return (
    <div className="min-h-screen">
      <AppHeader user={{ email: user.email }} isAdmin={user.role === 'ADMIN'} onLogout={logout} />
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
      <header className="mb-10">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">Nhật ký</p>
          <h1 className="font-serif text-5xl font-medium tracking-[-0.05em] sm:text-6xl">Lịch sử chọn món</h1>
          <p className="mt-3 text-sm text-muted-foreground">Hiển thị tối đa {user.historyRetentionDays} ngày gần nhất.</p>
        </div>
      </header>
      {historyQuery.isPending && <p className="text-muted-foreground">Đang tải lịch sử…</p>}
      {historyQuery.isError && <p role="alert" className="text-red-700">Không thể tải lịch sử.</p>}
      {historyQuery.data && <HistoryTimeline groups={historyQuery.data} timezone={user.timezone} />}
      </main>
    </div>
  );
}
