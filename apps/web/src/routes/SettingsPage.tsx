import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { AppHeader } from '../components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../features/auth/AuthProvider';
import { useDeleteAccountMutation, useUpdateSettingsMutation } from '../features/settings/queries';
import { RetentionSetting } from '../features/settings/RetentionSetting';
import { SessionList } from '../features/settings/SessionList';
import { TimezoneSetting } from '../features/settings/TimezoneSetting';

const settingsSchema = z.object({
  timezone: z.string().trim().min(1, 'Hãy nhập múi giờ'),
  historyRetentionDays: z.number().refine((value) => [7, 30, 90, 365].includes(value), 'Chọn một mốc lưu hợp lệ'),
});
type SettingsValues = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const { isSignedIn, user, logout, refresh } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { timezone: user?.timezone ?? 'Asia/Ho_Chi_Minh', historyRetentionDays: user?.historyRetentionDays ?? 30 },
  });
  const timezone = watch('timezone');
  const historyRetentionDays = watch('historyRetentionDays');
  const updateSettingsMutation = useUpdateSettingsMutation(user?.id ?? 'anonymous', refresh);
  const deleteAccountMutation = useDeleteAccountMutation(() => void logout());

  useEffect(() => {
    if (user) {
      reset({ timezone: user.timezone, historyRetentionDays: user.historyRetentionDays });
    }
  }, [reset, user]);

  if (!isSignedIn || !user) {
    return <main className="mx-auto flex min-h-screen items-center justify-center px-5"><Button asChild><Link to="/login">Đăng nhập</Link></Button></main>;
  }

  async function save(values: SettingsValues) {
    setMessage(null);
    setServerError(null);
    try {
      await updateSettingsMutation.mutateAsync(values);
      setMessage('Đã lưu cài đặt.');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Không thể lưu cài đặt.');
    }
  }

  async function removeAccount() {
    if (!window.confirm('Xóa tài khoản và toàn bộ dữ liệu riêng? Thao tác này không thể hoàn tác.')) return;
    try {
      await deleteAccountMutation.mutateAsync();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Không thể xóa tài khoản.');
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader user={{ email: user.email }} isAdmin={user.role === 'ADMIN'} onLogout={logout} />
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
      <header className="mb-10">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">Cài đặt</p>
          <h1 className="font-serif text-5xl font-medium tracking-[-0.05em] sm:text-6xl">Tài khoản</h1>
        </div>
      </header>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Ngày và lịch sử</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit(save)}>
              <TimezoneSetting value={timezone} onChange={(value) => setValue('timezone', value, { shouldValidate: true })} />
              <RetentionSetting value={historyRetentionDays} onChange={(value) => setValue('historyRetentionDays', value, { shouldValidate: true })} />
              <Button type="submit" disabled={isSubmitting || updateSettingsMutation.isPending}>{isSubmitting ? 'Đang lưu…' : 'Lưu cài đặt'}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Thiết bị đã đăng nhập</CardTitle></CardHeader>
          <CardContent><SessionList userId={user.id} /></CardContent>
        </Card>
        {(message || serverError) && <p role={serverError ? 'alert' : 'status'} className={serverError ? 'text-sm text-red-700' : 'text-sm text-primary'}>{serverError ?? message}</p>}
        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-red-900">Vùng nguy hiểm</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">Xóa tài khoản sẽ xóa món riêng, lịch sử và phiên đăng nhập của bạn.</p>
            <Button variant="outline" className="border-red-300 text-red-800 hover:bg-red-50" disabled={deleteAccountMutation.isPending} onClick={() => void removeAccount()}>Xóa tài khoản</Button>
          </CardContent>
        </Card>
      </div>
      </main>
    </div>
  );
}
