import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../features/auth/AuthProvider';
import { listSharedDishes } from '../features/dishes/api';
import { SharedDishList } from '../features/dishes/SharedDishList';

export function AdminPage() {
  const { accessToken, user } = useAuth();
  const sharedQuery = useQuery({
    queryKey: ['shared-dishes'],
    queryFn: () => listSharedDishes(accessToken!),
    enabled: Boolean(accessToken),
  });

  if (!accessToken || user?.role !== 'ADMIN') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="font-serif text-4xl">Khu vực dành cho admin</h1>
        <Button asChild variant="outline"><Link to="/">Về trang chủ</Link></Button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">Quản trị</p>
          <h1 className="font-serif text-5xl font-medium tracking-[-0.05em]">Món dùng chung</h1>
        </div>
        <Button asChild variant="outline"><Link to="/">Về trang chủ</Link></Button>
      </header>
      {sharedQuery.isPending && <p className="text-muted-foreground">Đang tải món dùng chung…</p>}
      {sharedQuery.isError && <p role="alert" className="text-red-700">Không thể tải món dùng chung.</p>}
      {sharedQuery.data && <SharedDishList accessToken={accessToken} dishes={sharedQuery.data} />}
    </main>
  );
}
