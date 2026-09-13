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

const registerSchema = z
  .object({
    email: z.string().email('Email chưa đúng định dạng'),
    password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Mật khẩu nhập lại chưa khớp',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerAccount } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      await registerAccount(values.email, values.password);
      navigate('/');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Đăng ký thất bại.');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">Choose Dish</p>
          <CardTitle>Tạo tài khoản</CardTitle>
          <p className="text-sm text-muted-foreground">Lưu lại những món bạn đã chọn mỗi ngày.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input id="register-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
              {errors.email && <p className="text-sm text-red-700">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Mật khẩu</Label>
              <Input id="register-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
              {errors.password && <p className="text-sm text-red-700">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">Nhập lại mật khẩu</Label>
              <Input id="register-confirm-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-sm text-red-700">{errors.confirmPassword.message}</p>}
            </div>
            {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo tài khoản…' : 'Đăng ký'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link className="font-semibold text-primary underline-offset-4 hover:underline" to="/login">
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
