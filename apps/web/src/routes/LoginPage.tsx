import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../features/auth/AuthProvider';

const loginSchema = z.object({
  email: z.string().email('Email chưa đúng định dạng'),
  password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Đăng nhập thất bại.');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">Choose Dish</p>
          <CardTitle>Đăng nhập</CardTitle>
          <p className="text-sm text-muted-foreground">Để mỗi bữa ăn bớt phải suy nghĩ.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
              {errors.email && <p className="text-sm text-red-700">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Mật khẩu</Label>
              <Input id="login-password" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
              {errors.password && <p className="text-sm text-red-700">{errors.password.message}</p>}
            </div>
            {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link className="font-semibold text-primary underline-offset-4 hover:underline" to="/register">
              Đăng ký
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
