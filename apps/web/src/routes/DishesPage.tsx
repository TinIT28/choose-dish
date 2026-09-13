import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { DishCard } from '../features/dishes/DishCard';
import { deleteDish, listDishes, listSharedDishes } from '../features/dishes/api';
import { DishForm } from '../features/dishes/DishForm';
import { SharedDishList } from '../features/dishes/SharedDishList';
import { useAuth } from '../features/auth/AuthProvider';

export function DishesPage() {
  const { accessToken } = useAuth();
  const [editingDish, setEditingDish] = useState<import('../features/dishes/api').Dish | undefined>();
  const dishesQuery = useQuery({
    queryKey: ['dishes'],
    queryFn: () => listDishes(accessToken!),
    enabled: Boolean(accessToken),
  });
  const sharedQuery = useQuery({
    queryKey: ['shared-dishes'],
    queryFn: () => listSharedDishes(accessToken!),
    enabled: Boolean(accessToken),
  });

  async function removeDish(dishId: string) {
    if (!window.confirm('Ẩn món này khỏi kho riêng? Lịch sử cũ vẫn được giữ lại.')) return;
    await deleteDish(accessToken!, dishId);
    await dishesQuery.refetch();
  }

  if (!accessToken) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="font-serif text-4xl">Đăng nhập để quản lý món</h1>
        <Button asChild><Link to="/login">Đăng nhập</Link></Button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">Kho món ăn</p>
          <h1 className="font-serif text-5xl font-medium tracking-[-0.05em]">Món riêng của bạn</h1>
        </div>
        <Button asChild variant="outline"><Link to="/">Về trang chọn món</Link></Button>
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Danh sách món ăn">
          {dishesQuery.isPending && <p className="text-muted-foreground">Đang tải danh sách món…</p>}
          {dishesQuery.isError && <p role="alert" className="text-red-700">Không thể tải danh sách món.</p>}
          {dishesQuery.data?.length === 0 && <p className="text-muted-foreground">Bạn chưa có món riêng nào.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {dishesQuery.data?.map((dish) => <DishCard key={dish.id} dish={dish} onEdit={() => setEditingDish(dish)} onDelete={() => void removeDish(dish.id)} />)}
          </div>
        </section>
        <div className="space-y-3">
          {editingDish && <Button variant="ghost" size="sm" onClick={() => setEditingDish(undefined)}>Hủy sửa</Button>}
          <DishForm
            key={editingDish?.id ?? 'new-dish'}
            accessToken={accessToken}
            initialDish={editingDish}
            title={editingDish ? 'Sửa món riêng' : 'Thêm món riêng'}
            onSaved={() => { setEditingDish(undefined); void dishesQuery.refetch(); }}
          />
        </div>
      </div>
      <section className="mt-12" aria-labelledby="shared-dishes-heading">
        <h2 id="shared-dishes-heading" className="mb-4 font-serif text-3xl font-medium">Món dùng chung</h2>
        {sharedQuery.isPending && <p className="text-muted-foreground">Đang tải món dùng chung…</p>}
        {sharedQuery.data && <SharedDishList accessToken={accessToken} dishes={sharedQuery.data} />}
      </section>
    </main>
  );
}
