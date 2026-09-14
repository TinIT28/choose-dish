import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { AppHeader } from "../components/AppHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAuth } from "../features/auth/AuthProvider";
import {
  type Dish,
} from "../features/dishes/api";
import { DishDialog } from "../features/dishes/DishDialog";
import {
  useAdminUsersQuery,
  useCreateSharedDishMutation,
  useDeleteSharedDishMutation,
  useSharedDishesQuery,
  useResetAdminPasswordMutation,
  useUpdateSharedDishMutation,
} from "../features/dishes/queries";
import { SharedDishList } from "../features/dishes/SharedDishList";

const resetPasswordSchema = z.object({
  userId: z.string().min(1, "Hãy chọn một tài khoản"),
  password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự"),
});
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function AdminPage() {
  const { isSignedIn, user, logout } = useAuth();
  const [editingDish, setEditingDish] = useState<Dish | undefined>();
  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const userId = user?.id ?? null;
  const sharedQuery = useSharedDishesQuery(userId);
  const usersQuery = useAdminUsersQuery(userId, user?.role === "ADMIN");
  const createSharedDishMutation = useCreateSharedDishMutation(userId);
  const updateSharedDishMutation = useUpdateSharedDishMutation(userId);
  const deleteSharedDishMutation = useDeleteSharedDishMutation(userId);
  const resetPasswordMutation = useResetAdminPasswordMutation();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { userId: "", password: "" },
  });

  if (!isSignedIn || !userId || user?.role !== "ADMIN") {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="font-serif text-4xl">Khu vực dành cho admin</h1>
        <Button asChild variant="outline">
          <Link to="/">Về trang chủ</Link>
        </Button>
      </main>
    );
  }

  async function resetPassword(values: ResetPasswordValues) {
    await resetPasswordMutation.mutateAsync(values);
    reset();
    setMessage("Đã đặt lại mật khẩu.");
  }

  async function removeSharedDish(dishId: string) {
    if (!window.confirm("Ngừng phát hành món dùng chung này?")) return;
    await deleteSharedDishMutation.mutateAsync(dishId);
    setEditingDish(undefined);
    setDishDialogOpen(false);
    setMessage("Đã ngừng phát hành món.");
  }

  return (
    <div className="min-h-screen">
      <AppHeader user={{ email: user.email }} isAdmin onLogout={logout} />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">
              Quản trị
            </p>
            <h1 className="font-serif text-5xl font-medium tracking-[-0.05em] sm:text-6xl">
              Món dùng chung
            </h1>
          </div>
          <Button type="button" onClick={() => { setEditingDish(undefined); setDishDialogOpen(true); }}><Plus className="size-4" aria-hidden="true" /> Thêm món</Button>
        </header>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            {sharedQuery.isPending && (
              <p className="text-muted-foreground">Đang tải món dùng chung…</p>
            )}
            {sharedQuery.isError && (
              <p role="alert" className="text-red-700">
                Không thể tải món dùng chung.
              </p>
            )}
            {sharedQuery.data && (
              <SharedDishList
                userId={userId}
                dishes={sharedQuery.data}
                onEdit={(dish) => { setEditingDish(dish); setDishDialogOpen(true); }}
              />
            )}
          </section>
          <div className="sticky top-8 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Đặt lại mật khẩu</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={handleSubmit(resetPassword)}
                >
                  <div className="space-y-2">
                    <label
                      className="text-sm font-semibold"
                      htmlFor="reset-user"
                    >
                      Tài khoản
                    </label>
                    <Controller
                      control={control}
                      name="userId"
                      render={({ field }) => (
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="reset-user" aria-invalid={Boolean(errors.userId)}>
                            <SelectValue placeholder="Chọn tài khoản" />
                          </SelectTrigger>
                          <SelectContent>
                            {usersQuery.data?.map((adminUser) => (
                              <SelectItem key={adminUser.id} value={adminUser.id}>
                                {adminUser.email} ({adminUser.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.userId && (
                      <p className="text-sm text-red-700">
                        {errors.userId.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-semibold"
                      htmlFor="reset-password"
                    >
                      Mật khẩu mới
                    </label>
                    <input
                      id="reset-password"
                      type="password"
                      className="flex h-11 w-full rounded-xl border bg-background px-3 text-sm"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-700">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    Đặt lại mật khẩu
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        {message && (
          <p role="status" className="mt-6 text-sm text-primary">
            {message}
          </p>
        )}
        <DishDialog
          open={dishDialogOpen}
          initialDish={editingDish}
          title={editingDish ? "Sửa món dùng chung" : "Thêm món dùng chung"}
          saveDish={(input) => editingDish
            ? updateSharedDishMutation.mutateAsync({ dishId: editingDish.id, input })
            : createSharedDishMutation.mutateAsync(input)}
          footer={editingDish ? (
            <Button type="button" variant="outline" className="w-full text-destructive" onClick={() => void removeSharedDish(editingDish.id)}>
              Ngừng phát hành món
            </Button>
          ) : undefined}
          onOpenChange={(open) => { setDishDialogOpen(open); if (!open) setEditingDish(undefined); }}
          onSaved={() => {
            setEditingDish(undefined);
            setDishDialogOpen(false);
            setMessage("Đã lưu món dùng chung.");
          }}
        />
      </main>
    </div>
  );
}
