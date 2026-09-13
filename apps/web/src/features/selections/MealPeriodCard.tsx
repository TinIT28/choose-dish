import { Clock3, Moon, RefreshCw, Sparkles, Sun, Sunrise } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { mealPeriodLabels, type MealPeriod, type Selection } from "./api";
import type { DishCandidate } from "./availableDishes";

interface MealPeriodCardProps {
  mealPeriod: MealPeriod;
  selection?: Selection;
  candidates?: DishCandidate[];
  timezone: string;
  isLoading?: boolean;
  isCurrent?: boolean;
  onRandom: (mealPeriod: MealPeriod) => void;
}

function formatSelectionTime(selectedAt: string, timezone: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(new Date(selectedAt));
}

export function MealPeriodIcon({ mealPeriod }: { mealPeriod: MealPeriod }) {
  const Icon =
    mealPeriod === "BREAKFAST" ? Sunrise : mealPeriod === "LUNCH" ? Sun : Moon;
  return <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />;
}

export function MealPeriodCard({
  mealPeriod,
  selection,
  candidates = [],
  timezone,
  isLoading = false,
  isCurrent = false,
  onRandom,
}: MealPeriodCardProps) {
  const period = mealPeriodLabels[mealPeriod];
  const [previewIndex, setPreviewIndex] = useState(0);
  const selectedDish = selection
    ? candidates.find((dish) => dish.id === selection.dishId)
    : undefined;
  const previewDish = isLoading
    ? candidates[previewIndex % Math.max(candidates.length, 1)]
    : (selectedDish ?? candidates[0]);

  useEffect(() => {
    if (!isLoading || candidates.length < 2) return undefined;
    const timer = window.setInterval(
      () => setPreviewIndex((current) => (current + 1) % candidates.length),
      140,
    );
    return () => window.clearInterval(timer);
  }, [candidates.length, isLoading]);

  const canChoose = Boolean(selection || candidates.length > 0);

  return (
    <Card className={`group flex min-h-[34rem] flex-col overflow-hidden bg-card shadow-[0_18px_50px_-28px_rgba(36,90,69,0.5)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-28px_rgba(36,90,69,0.6)] ${isCurrent ? 'border-primary/35 ring-2 ring-primary/10' : 'border-transparent'}`}>
      <CardHeader className="gap-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <MealPeriodIcon mealPeriod={mealPeriod} />
            </span>
            <div>
              <CardTitle className="text-xl">{period.title}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {period.time}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${selection || isCurrent ? "bg-[#e6f0e8] text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {isCurrent ? (selection ? "Đã chọn · hiện tại" : "Đang chọn") : selection ? "Đã chọn" : "Chưa chọn"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{period.description}</p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        {previewDish && (
          <div
            className={`relative overflow-hidden rounded-2xl border border-border/70 bg-muted ${isLoading ? "animate-dish-shuffle" : ""}`}
            aria-live="polite"
            role={isLoading ? "status" : undefined}
          >
            <img
              className="aspect-[16/9] w-full object-cover"
              src={previewDish.imageUrl}
              alt=""
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 pb-3 pt-10 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                {isLoading
                  ? "Đang xáo trộn món"
                  : selection
                    ? "Món đã chọn"
                    : "Gợi ý nổi bật"}
              </p>
              <p className="mt-1 font-serif text-xl font-medium">
                {previewDish.name}
              </p>
            </div>
          </div>
        )}

        {selection ? (
          <div className="flex items-start gap-3 rounded-2xl bg-secondary/60 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary">
              <Clock3 className="size-4" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">{selection.dishNameSnapshot}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Đã chọn lúc{" "}
                {formatSelectionTime(selection.selectedAt, timezone)}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-background/50 p-4">
            <p className="text-sm font-semibold">
              Chưa chọn món cho {period.title.toLowerCase()}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Để Choose Dish chọn giúp bạn một món phù hợp từ kho món.
            </p>
          </div>
        )}

        {candidates.length > 0 && (
          <div className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Gợi ý cho bạn
              </p>
              <span className="text-xs text-muted-foreground">
                {candidates.length} món
              </span>
            </div>
            <ul
              className="flex gap-2 overflow-x-auto pb-1"
              aria-label={`Các món có thể chọn cho ${period.title}`}
            >
              {candidates.slice(0, 6).map((dish) => (
                <li
                  key={dish.id}
                  className="min-w-28 max-w-32 shrink-0 rounded-xl border border-border/70 bg-background/60 p-2 transition-colors hover:border-primary/40 hover:bg-secondary/50"
                >
                  <img
                    className="mb-2 aspect-4/3 w-full rounded-lg object-cover"
                    src={dish.imageUrl}
                    alt=""
                    loading="lazy"
                  />
                  <p
                    className="truncate text-xs font-semibold"
                    title={dish.name}
                  >
                    {dish.name}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          className="mt-auto w-full"
          type="button"
          disabled={isLoading || !canChoose}
          onClick={() => onRandom(mealPeriod)}
        >
          {isLoading ? (
            <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
          ) : selection ? (
            <RefreshCw className="size-4" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          {isLoading
            ? "Đang chọn…"
            : selection
              ? "Chọn lại"
              : canChoose
                ? "Chọn món ngẫu nhiên"
                : "Thêm món trước"}
        </Button>
      </CardContent>
    </Card>
  );
}
