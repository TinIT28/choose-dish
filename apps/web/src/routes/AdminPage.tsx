import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../features/auth/AuthProvider';
import { createSharedDish, deleteSharedDish, listAdminUsers, listSharedDishes, resetAdminPassword, updateSharedDish, type Dish } from '../features/dishes/api';
import { DishForm } from '../features/dishes/DishForm';
import { SharedDishList } from '../features/dishes/SharedDishList';

const resetPasswordSchema = z.object({
  userId: z.string().min(1, 'Hãy chọn một tài khoản'),
  password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự'),
});
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function AdminPage() {
  const { accessToken, user } = useAuth();
  const [editingDish, setEditingDish] = useState<Dish | undefined>();
  const [message, setMessage] = useState<string | null>(null);
  const sharedQuery = useQuery({
    queryKey: ['shared-dishes'],
    queryFn: () => listSharedDishes(accessToken!),
    enabled: Boolean(accessToken),
  });
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => listAdminUsers(accessToken!),
    enabled: Boolean(accessToken && user?.role === 'ADMIN'),
  });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  if (!accessToken || user?.role !== 'ADMIN') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="font-serif text-4xl">Khu vực dành cho admin</h1>
        <Button asChild variant="outline"><Link to="/">Về trang chủ</Link></Button>
      </main>
    );
  }

  const token = accessToken;

  async function resetPassword(values: ResetPasswordValues) {
    await resetAdminPassword(token, values.userId, values.password);
    reset();
    setMessage('Đã đặt lại mật khẩu.');
  }

  async function removeSharedDish(dishId: string) {
    if (!window.confirm('Ngừng phát hành món dùng chung này?')) return;
    await deleteSharedDish(token, dishId);
    await sharedQuery.refetch();
    setMessage('Đã ngừng phát hành món.');
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
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          {sharedQuery.isPending && <p className="text-muted-foreground">Đang tải món dùng chung…</p>}
          {sharedQuery.isError && <p role="alert" className="text-red-700">Không thể tải món dùng chung.</p>}
          {sharedQuery.data && <SharedDishList accessToken={token} dishes={sharedQuery.data} onEdit={setEditingDish} />}
        </section>
        <div className="space-y-5">
          <DishForm
            key={editingDish?.id ?? 'new-shared-dish'}
            accessToken={token}
            initialDish={editingDish}
            title={editingDish ? 'Sửa món dùng chung' : 'Thêm món dùng chung'}
            saveDish={(input) => editingDish ? updateSharedDish(token, editingDish.id, input) : createSharedDish(token, input)}
            onSaved={() => { setEditingDish(undefined); void sharedQuery.refetch(); setMessage('Đã lưu món dùng chung.'); }}
          />
          {editingDish && <Button variant="ghost" size="sm" onClick={() => setEditingDish(undefined)}>Hủy sửa</Button>}
          {editingDish && <Button variant="outline" className="text-red-800" onClick={() => void removeSharedDish(editingDish.id)}>Ngừng phát hành</Button>}
          <Card>
            <CardHeader><CardTitle>Đặt lại mật khẩu</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit(resetPassword)}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="reset-user">Tài khoản</label>
                  <select id="reset-user" className="flex h-11 w-full rounded-xl border bg-background px-3 text-sm" {...register('userId')}>
                    <option value="">Chọn tài khoản</option>
                    {usersQuery.data?.map((adminUser) => <option key={adminUser.id} value={adminUser.id}>{adminUser.email} ({adminUser.role})</option>)}
                  </select>
                  {errors.userId && <p className="text-sm text-red-700">{errors.userId.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="reset-password">Mật khẩu mới</label>
                  <input id="reset-password" type="password" className="flex h-11 w-full rounded-xl border bg-background px-3 text-sm" {...register('password')} />
                  {errors.password && <p className="text-sm text-red-700">{errors.password.message}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting}>Đặt lại mật khẩu</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      {message && <p role="status" className="mt-6 text-sm text-primary">{message}</p>}
    </main>
  );
}
