import { Check, Clock3, ListFilter, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../components/ui/sheet';
import { mealPeriodLabels, type MealPeriod, type Selection } from './api';
import { MealPeriodIcon } from './MealPeriodCard';
import type { DishCandidate } from './availableDishes';

const mealPeriods: MealPeriod[] = ['BREAKFAST', 'LUNCH', 'DINNER'];
const mealWindows = [
  { start: 360, end: 630 },
  { start: 630, end: 870 },
  { start: 1020, end: 1320 },
];

function getMinutesInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return Math.min(hour, 23) * 60 + minute;
}

export function getCurrentMealPeriod(now: Date, timezone: string): MealPeriod {
  const currentMinutes = getMinutesInTimezone(now, timezone);
  if (currentMinutes < mealWindows[0].start || currentMinutes >= mealWindows[2].end) return 'BREAKFAST';
  if (currentMinutes < mealWindows[0].end) return 'BREAKFAST';
  if (currentMinutes < mealWindows[1].end) return 'LUNCH';
  return 'DINNER';
}

export function getNextMealPeriod(now: Date, selections: Selection[], timezone: string): MealPeriod {
  const selectedPeriods = new Set(selections.map((selection) => selection.mealPeriod));
  const activeIndex = mealPeriods.indexOf(getCurrentMealPeriod(now, timezone));

  for (let offset = 0; offset < mealPeriods.length; offset += 1) {
    const period = mealPeriods[(activeIndex + offset) % mealPeriods.length];
    if (!selectedPeriods.has(period)) return period;
  }

  return mealPeriods[activeIndex];
}

function formatSelectionTime(selectedAt: string, timezone: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(new Date(selectedAt));
}

interface DailyMealFocusProps {
  mealPeriod: MealPeriod;
  selection?: Selection;
  candidates?: DishCandidate[];
  timezone: string;
  isLoading?: boolean;
  isDayComplete?: boolean;
  onRandom: (mealPeriod: MealPeriod) => void;
}

export function DailyMealFocus({
  mealPeriod,
  selection,
  candidates = [],
  timezone,
  isLoading = false,
  isDayComplete = false,
  onRandom,
}: DailyMealFocusProps) {
  const period = mealPeriodLabels[mealPeriod];
  const selectedDish = selection ? candidates.find((dish) => dish.id === selection.dishId) : undefined;
  const previewDish = selectedDish ?? candidates[0];
  const canChoose = Boolean(selection || candidates.length > 0);

  return (
    <Card className="overflow-hidden border-primary/10 bg-card shadow-[0_22px_60px_-32px_rgba(36,90,69,0.75)]">
      <CardHeader className="gap-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c76d3e]">{isDayComplete ? 'Đã đủ món hôm nay' : 'Bữa hiện tại'}</p>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <MealPeriodIcon mealPeriod={mealPeriod} />
              </span>
              <div>
                <CardTitle className="text-2xl">{period.title}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{period.time}</p>
              </div>
            </div>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary-foreground">
            {selection ? 'Đã chọn' : 'Đang chờ'}
          </span>
        </div>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">
          {isDayComplete ? 'Bạn đã có món cho cả ba bữa.' : selection ? 'Món đã sẵn sàng cho bữa ăn này.' : `Để Choose Dish gợi ý giúp bạn cho ${period.title.toLowerCase()}.`}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {previewDish ? (
          <div className={`relative overflow-hidden rounded-[1.4rem] bg-muted ${isLoading ? 'animate-dish-shuffle' : ''}`} role={isLoading ? 'status' : undefined} aria-live="polite">
            <img className="aspect-[16/10] w-full object-cover" src={previewDish.imageUrl} alt="" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pb-4 pt-12 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                {isLoading ? 'Đang xáo trộn món' : selection ? 'Món đã chọn' : 'Gợi ý nổi bật'}
              </p>
              <p className="mt-1 font-serif text-2xl font-medium">{selection?.dishNameSnapshot ?? previewDish.name}</p>
            </div>
          </div>
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center rounded-[1.4rem] border border-dashed border-border bg-muted/60 px-8 text-center text-sm text-muted-foreground">
            Thêm món vào kho để bắt đầu random.
          </div>
        )}

        {selection && (
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/70 px-3 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary">
              <Clock3 className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Đã lưu lựa chọn</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Lúc {formatSelectionTime(selection.selectedAt, timezone)}</p>
            </div>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Button
            className="h-12 w-full"
            type="button"
            disabled={isLoading || !canChoose}
            aria-label={`${selection ? 'Đổi món' : 'Chọn món ngẫu nhiên'} cho ${period.title}`}
            onClick={() => onRandom(mealPeriod)}
          >
            {isLoading ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : selection ? <RefreshCw className="size-4" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
            {isLoading ? 'Đang chọn…' : selection ? 'Đổi món' : canChoose ? 'Chọn món ngẫu nhiên' : 'Thêm món trước'}
          </Button>

          {candidates.length > 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button className="h-12 w-full sm:w-auto" type="button" variant="outline">
                  <ListFilter className="size-4" aria-hidden="true" />
                  <span className="sm:hidden">Xem danh sách món</span>
                  <span className="hidden sm:inline">{candidates.length} món</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[82vh] rounded-t-[2rem] p-5">
                <SheetHeader className="pr-10">
                  <SheetTitle>Danh sách món cho {period.title}</SheetTitle>
                  <SheetDescription>Danh sách này chỉ để tham khảo. Choose Dish sẽ chọn ngẫu nhiên khi bạn bấm nút chính.</SheetDescription>
                </SheetHeader>
                <ul className="mt-6 grid max-h-[55vh] gap-3 overflow-y-auto sm:grid-cols-2">
                  {candidates.map((dish) => (
                    <li key={dish.id} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-2.5">
                      <img className="size-16 rounded-xl object-cover" src={dish.imageUrl} alt="" loading="lazy" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{dish.name}</p>
                        {dish.shortDescription && <p className="mt-1 truncate text-xs text-muted-foreground">{dish.shortDescription}</p>}
                        {selection?.dishId === dish.id && <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary"><Check className="size-3" aria-hidden="true" /> Đang được chọn</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
