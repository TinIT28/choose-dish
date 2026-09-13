import './app.css';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LoginPage } from '../routes/LoginPage';
import { RegisterPage } from '../routes/RegisterPage';

const mealPeriods = [
  { title: 'Bữa sáng', icon: '☀️' },
  { title: 'Bữa trưa', icon: '🍲' },
  { title: 'Bữa tối', icon: '🌙' },
];

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<DashboardPreview />} />
      </Routes>
    </BrowserRouter>
  );
}

function DashboardPreview() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-10 max-w-3xl sm:mb-14">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#c76d3e]">Choose Dish</p>
        <h1 className="mb-4 max-w-2xl font-serif text-5xl font-medium leading-[0.95] tracking-[-0.06em] sm:text-7xl">
          Chọn món hôm nay
        </h1>
        <p className="text-lg text-muted-foreground">Để mỗi bữa ăn bớt phải suy nghĩ.</p>
        <div className="mt-6 flex gap-3">
          <Button asChild variant="outline">
            <Link to="/login">Đăng nhập</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Tạo tài khoản</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Các bữa ăn hôm nay">
        {mealPeriods.map((period) => (
          <Card className="flex min-h-56 flex-col" key={period.title}>
            <CardHeader className="pb-3">
              <span className="text-2xl" aria-hidden="true">
                {period.icon}
              </span>
              <CardTitle>{period.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="size-4" aria-hidden="true" />
                Chưa chọn món
              </p>
              <Button className="mt-auto w-full" type="button">
                <Sparkles className="size-4" aria-hidden="true" />
                Chọn món
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
