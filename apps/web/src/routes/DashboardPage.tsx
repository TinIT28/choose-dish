import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { useAuth } from '../features/auth/AuthProvider';
import { listTodaySelections, randomSelection, type MealPeriod } from '../features/selections/api';
import { MealPeriodCard } from '../features/selections/MealPeriodCard';

const mealPeriods: MealPeriod[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

export function DashboardPage() {
  const { accessToken, user } = useAuth();
  const [busyPeriod, setBusyPeriod] = useState<MealPeriod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectionsQuery = useQuery({
    queryKey: ['selections', 'today'],
    queryFn: () => listTodaySelections(accessToken!),
    enabled: Boolean(accessToken),
  });

  async function choose(mealPeriod: MealPeriod) {
    if (!accessToken) return;
    setBusyPeriod(mealPeriod);
    setError(null);
    try {
      await randomSelection(accessToken, mealPeriod);
      await selectionsQuery.refetch();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể chọn món.');
    } finally {
      setBusyPeriod(null);
    }
  }

  const selections = selectionsQuery.data ?? [];
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-5 sm:mb-14">
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">Choose Dish</p>
          <h1 className="mb-4 max-w-2xl font-serif text-5xl font-medium leading-[0.95] tracking-[-0.06em] sm:text-7xl">Chọn món hôm nay</h1>
          <p className="text-lg text-muted-foreground">Để mỗi bữa ăn bớt phải suy nghĩ.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/dishes">Kho món</Link></Button>
          {user && <Button asChild variant="outline"><Link to="/settings">Cài đặt</Link></Button>}
          {user && <Button asChild variant="outline"><Link to="/history">Lịch sử</Link></Button>}
          {!user && <Button asChild><Link to="/login">Đăng nhập</Link></Button>}
        </div>
      </header>
      {selectionsQuery.isPending && accessToken && <p className="mb-4 text-sm text-muted-foreground">Đang tải lựa chọn hôm nay…</p>}
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      <section className="grid gap-4 md:grid-cols-3" aria-label="Các bữa ăn hôm nay">
        {mealPeriods.map((mealPeriod) => (
          <MealPeriodCard
            key={mealPeriod}
            mealPeriod={mealPeriod}
            selection={selections.find((selection) => selection.mealPeriod === mealPeriod)}
            timezone={user?.timezone ?? 'Asia/Ho_Chi_Minh'}
            isLoading={busyPeriod === mealPeriod}
            onRandom={(period) => void choose(period)}
          />
        ))}
      </section>
    </main>
  );
}
