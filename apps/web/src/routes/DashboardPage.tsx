import { useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { Check, Circle } from 'lucide-react';
import { useAuth } from '../features/auth/AuthProvider';
import { usePrivateDishesQuery, useSharedDishesQuery } from '../features/dishes/queries';
import { mealPeriodLabels, type MealPeriod } from '../features/selections/api';
import { getAvailableDishes } from '../features/selections/availableDishes';
import { DailyMealFocus, getCurrentMealPeriod } from '../features/selections/DailyMealFocus';
import { MealPeriodCard } from '../features/selections/MealPeriodCard';
import { useRandomSelectionMutation, useTodaySelectionsQuery } from '../features/selections/queries';

const mealPeriods: MealPeriod[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

export function DashboardPage() {
  const { accessToken, user, logout } = useAuth();
  const [busyPeriod, setBusyPeriod] = useState<MealPeriod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id ?? null;
  const selectionsQuery = useTodaySelectionsQuery(accessToken, userId);
  const privateDishesQuery = usePrivateDishesQuery(accessToken, userId);
  const sharedDishesQuery = useSharedDishesQuery(accessToken, userId);
  const randomSelectionMutation = useRandomSelectionMutation(accessToken, userId);

  async function choose(mealPeriod: MealPeriod) {
    if (!accessToken) return;
    setBusyPeriod(mealPeriod);
    setError(null);
    try {
      await randomSelectionMutation.mutateAsync(mealPeriod);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể chọn món.');
    } finally {
      setBusyPeriod(null);
    }
  }

  const selections = selectionsQuery.data ?? [];
  const availableDishes = getAvailableDishes([
    ...(privateDishesQuery.data ?? []),
    ...(sharedDishesQuery.data ?? []),
  ]);
  const timezone = user?.timezone ?? 'Asia/Ho_Chi_Minh';
  const completedMeals = selections.length;
  const isDayComplete = completedMeals === mealPeriods.length;
  const focusMealPeriod = isDayComplete ? 'DINNER' : getCurrentMealPeriod(new Date(), timezone);
  const focusSelection = selections.find((selection) => selection.mealPeriod === focusMealPeriod);
  const todayLabel = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="min-h-screen">
      <AppHeader user={user ? { email: user.email } : null} isAdmin={user?.role === 'ADMIN'} onLogout={user ? logout : undefined} />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <header className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end lg:gap-10">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">{todayLabel}</p>
            <h1 className="max-w-2xl font-serif text-4xl font-medium leading-[0.98] tracking-[-0.06em] sm:text-7xl">Chọn món hôm nay</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg sm:leading-8">Để mỗi bữa ăn bớt phải suy nghĩ. Bạn chọn cảm hứng, Choose Dish lo phần còn lại.</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-[0_20px_45px_-26px_rgba(36,90,69,0.9)]">
            <div className="absolute -right-8 -top-10 size-32 rounded-full border border-white/10" aria-hidden="true" />
            <div className="absolute -bottom-12 -right-2 size-32 rounded-full border border-white/10" aria-hidden="true" />
            <p className="relative text-xs font-bold uppercase tracking-[0.16em] text-white/65">Tiến độ hôm nay</p>
            <p className="relative mt-3 font-serif text-5xl leading-none">{completedMeals}<span className="text-2xl text-white/50">/3</span></p>
            <p className="relative mt-2 text-sm text-white/75">bữa ăn đã có món</p>
          </div>
        </header>

      {selectionsQuery.isPending && accessToken && <p className="mb-4 text-sm text-muted-foreground">Đang tải lựa chọn hôm nay…</p>}
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
        {privateDishesQuery.isError || sharedDishesQuery.isError ? <p className="mb-4 text-sm text-amber-800">Một phần kho món chưa tải được. Bạn vẫn có thể xem các món đã có.</p> : null}
        <section className="space-y-5 lg:hidden" aria-label="Bữa hiện tại">
          <DailyMealFocus
            mealPeriod={focusMealPeriod}
            candidates={availableDishes}
            selection={focusSelection}
            timezone={timezone}
            isLoading={busyPeriod === focusMealPeriod}
            isDayComplete={isDayComplete}
            onRandom={(period) => void choose(period)}
          />

          <div className="rounded-3xl border border-border/70 bg-card/70 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Các bữa hôm nay</p>
                <p className="mt-1 text-sm text-muted-foreground">Theo dõi nhanh lựa chọn của bạn</p>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{completedMeals}/3</span>
            </div>
            <div className="grid gap-2">
              {mealPeriods.map((mealPeriod) => {
                const selection = selections.find((item) => item.mealPeriod === mealPeriod);
                const isCurrent = mealPeriod === focusMealPeriod;
                const period = mealPeriodLabels[mealPeriod];

                return (
                  <div key={mealPeriod} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${isCurrent ? 'border-primary/30 bg-secondary/60' : 'border-transparent bg-background/60'}`}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                      {selection ? <Check className="size-4" aria-hidden="true" /> : <Circle className="size-4" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{period.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{selection?.dishNameSnapshot ?? period.time}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{selection ? 'Đã chọn' : isCurrent ? 'Đang chọn' : 'Chưa chọn'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="hidden gap-5 lg:grid lg:grid-cols-3" aria-label="Các bữa ăn hôm nay">
          {mealPeriods.map((mealPeriod) => (
            <MealPeriodCard
              key={mealPeriod}
              mealPeriod={mealPeriod}
              candidates={availableDishes}
              selection={selections.find((selection) => selection.mealPeriod === mealPeriod)}
              timezone={timezone}
              isLoading={busyPeriod === mealPeriod}
              isCurrent={mealPeriod === focusMealPeriod}
              onRandom={(period) => void choose(period)}
            />
          ))}
        </section>
        {!accessToken && <p className="mt-8 text-center text-sm text-muted-foreground">Đăng nhập để lưu lựa chọn và xem lại lịch sử món ăn.</p>}
      </main>
    </div>
  );
}
