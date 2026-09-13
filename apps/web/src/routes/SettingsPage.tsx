import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../features/auth/AuthProvider';
import { deleteAccount, updateSettings } from '../features/settings/api';
import { RetentionSetting } from '../features/settings/RetentionSetting';
import { SessionList } from '../features/settings/SessionList';
import { TimezoneSetting } from '../features/settings/TimezoneSetting';

const settingsSchema = z.object({
  timezone: z.string().trim().min(1, 'Hãy nhập múi giờ'),
  historyRetentionDays: z.number().refine((value) => [7, 30, 90, 365].includes(value), 'Chọn một mốc lưu hợp lệ'),
});
type SettingsValues = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const { accessToken, user, logout } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { timezone: user?.timezone ?? 'Asia/Ho_Chi_Minh', historyRetentionDays: user?.historyRetentionDays ?? 30 },
  });
  const timezone = watch('timezone');
  const historyRetentionDays = watch('historyRetentionDays');

  useEffect(() => {
    if (user) {
      reset({ timezone: user.timezone, historyRetentionDays: user.historyRetentionDays });
    }
  }, [reset, user]);

  if (!accessToken || !user) {
    return <main className="mx-auto flex min-h-screen items-center justify-center px-5"><Button asChild><Link to="/login">Đăng nhập</Link></Button></main>;
  }

  const token = accessToken;

  async function save(values: SettingsValues) {
    setMessage(null);
    setServerError(null);
    try {
      await updateSettings(token, values);
      setMessage('Đã lưu cài đặt.');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Không thể lưu cài đặt.');
    }
  }

  async function removeAccount() {
    if (!window.confirm('Xóa tài khoản và toàn bộ dữ liệu riêng? Thao tác này không thể hoàn tác.')) return;
    try {
      await deleteAccount(token);
      await logout();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Không thể xóa tài khoản.');
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">Cài đặt</p>
          <h1 className="font-serif text-5xl font-medium tracking-[-0.05em]">Tài khoản</h1>
        </div>
        <Button asChild variant="outline"><Link to="/">Trang chủ</Link></Button>
      </header>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Ngày và lịch sử</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit(save)}>
              <TimezoneSetting value={timezone} onChange={(value) => setValue('timezone', value, { shouldValidate: true })} />
              <RetentionSetting value={historyRetentionDays} onChange={(value) => setValue('historyRetentionDays', value, { shouldValidate: true })} />
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu…' : 'Lưu cài đặt'}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Thiết bị đã đăng nhập</CardTitle></CardHeader>
          <CardContent><SessionList accessToken={token} /></CardContent>
        </Card>
        {(message || serverError) && <p role={serverError ? 'alert' : 'status'} className={serverError ? 'text-sm text-red-700' : 'text-sm text-primary'}>{serverError ?? message}</p>}
        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-red-900">Vùng nguy hiểm</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">Xóa tài khoản sẽ xóa món riêng, lịch sử và phiên đăng nhập của bạn.</p>
            <Button variant="outline" className="border-red-300 text-red-800 hover:bg-red-50" onClick={() => void removeAccount()}>Xóa tài khoản</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
