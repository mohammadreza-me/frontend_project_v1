'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore, useUIStore } from '@/stores';
import { useTranslation } from '@/lib/i18n/use-translation';
import { loginApi } from '@/features/auth/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Brain, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'auth.emailRequired').email('auth.invalidEmail'),
  password: z.string().min(6, 'auth.passwordMin'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm() {
  const t = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useUIStore((s) => s.navigate);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      navigate('dashboard');
    },
  });

  const onSubmit = (data: LoginForm) => {
    mutation.mutate(data);
  };

  const getError = (field: string) => {
    const key = errors[field?.toLowerCase()]?.message;
    if (!key) return '';
    const msgKey = key as string;
    return (t.auth as Record<string, string>)[msgKey] || msgKey;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/30">
            <Brain className="size-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.common.appName}</h1>
        </div>

        <Card className="shadow-xl shadow-black/5 border-border/50">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-xl">{t.auth.loginTitle}</CardTitle>
            <CardDescription>{t.auth.loginSubtitle}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">{t.auth.email}</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  dir="ltr"
                  className="text-start"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{getError('email')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">{t.auth.password}</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{getError('password')}</p>
                )}
              </div>
              {mutation.isError && (
                <p className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
                  {t.common.error}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={mutation.isPending}
              >
                {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {t.auth.loginButton}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t.auth.noAccount}{' '}
                <button
                  type="button"
                  className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                  onClick={() => navigate('register')}
                >
                  {t.auth.register}
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}