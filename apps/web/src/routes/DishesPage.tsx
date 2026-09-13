import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/ui/button';
import { DishCard } from '../features/dishes/DishCard';
import { DishCatalogToolbar, type DishCatalogTab } from '../features/dishes/DishCatalogToolbar';
import { DishDialog } from '../features/dishes/DishDialog';
import { DishEmptyState } from '../features/dishes/DishEmptyState';
import { filterAndSortDishes, type DishCatalogSort } from '../features/dishes/catalog';
import type { Dish } from '../features/dishes/api';
import {
  useCreateDishMutation,
  useDeleteDishMutation,
  usePrivateDishesQuery,
  useSharedDishesQuery,
  useUpdateDishMutation,
} from '../features/dishes/queries';
import { SharedDishList } from '../features/dishes/SharedDishList';
import { useAuth } from '../features/auth/AuthProvider';

export function DishesPage() {
  const { accessToken, user, logout } = useAuth();
  const [editingDish, setEditingDish] = useState<Dish | undefined>();
  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DishCatalogTab>('private');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<DishCatalogSort>('name-asc');
  const userId = user?.id ?? null;
  const dishesQuery = usePrivateDishesQuery(accessToken, userId);
  const sharedQuery = useSharedDishesQuery(accessToken, userId);
  const createDishMutation = useCreateDishMutation(accessToken, userId);
  const updateDishMutation = useUpdateDishMutation(accessToken, userId);
  const deleteDishMutation = useDeleteDishMutation(accessToken, userId);
  const privateDishes = useMemo(() => filterAndSortDishes(dishesQuery.data ?? [], search, sort), [dishesQuery.data, search, sort]);
  const sharedDishes = useMemo(() => filterAndSortDishes(sharedQuery.data ?? [], search, sort), [sharedQuery.data, search, sort]);
  const hasSearch = search.trim().length > 0;

  async function removeDish(dishId: string) {
    if (!window.confirm('Ẩn món này khỏi kho riêng? Lịch sử cũ vẫn được giữ lại.')) return;
    await deleteDishMutation.mutateAsync(dishId);
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
    <div className="min-h-screen">
      <AppHeader user={user ? { email: user.email } : null} isAdmin={user?.role === 'ADMIN'} onLogout={logout} />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">Kho món ăn</p>
            <h1 className="font-serif text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">Chọn món dễ hơn</h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">Một góc nhỏ để lưu những món bạn yêu thích và luôn có cảm hứng cho bữa ăn tiếp theo.</p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-full bg-secondary px-3 py-1.5">{dishesQuery.data?.length ?? 0} món riêng</span>
              <span className="rounded-full bg-secondary px-3 py-1.5">{sharedQuery.data?.length ?? 0} món dùng chung</span>
            </div>
          </div>
          <Button type="button" size="lg" onClick={() => { setEditingDish(undefined); setDishDialogOpen(true); }}>
            <Plus className="size-4" aria-hidden="true" /> Thêm món
          </Button>
        </header>

        <DishCatalogToolbar
          activeTab={activeTab}
          privateCount={dishesQuery.data?.length ?? 0}
          sharedCount={sharedQuery.data?.length ?? 0}
          search={search}
          sort={sort}
          onTabChange={setActiveTab}
          onSearchChange={setSearch}
          onSortChange={setSort}
        />

        {dishesQuery.isError && activeTab === 'private' && <p role="alert" className="mt-6 text-sm text-red-700">Không thể tải danh sách món riêng.</p>}
        {sharedQuery.isError && activeTab === 'shared' && <p role="alert" className="mt-6 text-sm text-red-700">Không thể tải danh sách món dùng chung.</p>}

        <section role="tabpanel" aria-label={activeTab === 'private' ? 'Món riêng' : 'Món dùng chung'} className="mt-8">
          {activeTab === 'private' && dishesQuery.isPending && <p className="text-sm text-muted-foreground">Đang tải kho món riêng…</p>}
          {activeTab === 'shared' && sharedQuery.isPending && <p className="text-sm text-muted-foreground">Đang tải kho món dùng chung…</p>}

          {activeTab === 'private' && !dishesQuery.isPending && privateDishes.length === 0 && (
            <DishEmptyState
              hasSearch={hasSearch}
              title={hasSearch ? 'Không tìm thấy món phù hợp' : 'Kho món của bạn đang trống'}
              description={hasSearch ? 'Thử tìm bằng một tên món khác hoặc xóa bộ lọc tìm kiếm.' : 'Thêm món đầu tiên để lần chọn món sau có thêm nhiều cảm hứng.'}
              onAdd={() => { setEditingDish(undefined); setDishDialogOpen(true); }}
            />
          )}
          {activeTab === 'private' && privateDishes.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {privateDishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  onEdit={() => { setEditingDish(dish); setDishDialogOpen(true); }}
                  onDelete={() => void removeDish(dish.id)}
                />
              ))}
            </div>
          )}

          {activeTab === 'shared' && !sharedQuery.isPending && sharedDishes.length === 0 && (
            <DishEmptyState
              hasSearch={hasSearch}
              title={hasSearch ? 'Không tìm thấy món phù hợp' : 'Chưa có món dùng chung'}
              description={hasSearch ? 'Thử tìm bằng một tên món khác hoặc xóa bộ lọc tìm kiếm.' : 'Các món được quản trị viên phát hành sẽ xuất hiện ở đây.'}
            />
          )}
          {activeTab === 'shared' && sharedDishes.length > 0 && (
            <SharedDishList accessToken={accessToken} userId={userId!} dishes={sharedDishes} />
          )}
        </section>
      <DishDialog
        open={dishDialogOpen}
        accessToken={accessToken}
        initialDish={editingDish}
        title={editingDish ? 'Sửa món riêng' : 'Thêm món riêng'}
        onOpenChange={(open) => { setDishDialogOpen(open); if (!open) setEditingDish(undefined); }}
        saveDish={(input) => editingDish
          ? updateDishMutation.mutateAsync({ dishId: editingDish.id, input })
          : createDishMutation.mutateAsync(input)}
        onSaved={() => { setDishDialogOpen(false); setEditingDish(undefined); }}
      />
      </main>
    </div>
  );
}
