import { RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { mealPeriodLabels, type MealPeriod, type Selection } from './api';

interface MealPeriodCardProps {
  mealPeriod: MealPeriod;
  selection?: Selection;
  timezone: string;
  isLoading?: boolean;
  onRandom: (mealPeriod: MealPeriod) => void;
}

function formatSelectionTime(selectedAt: string, timezone: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(new Date(selectedAt));
}

export function MealPeriodCard({ mealPeriod, selection, timezone, isLoading = false, onRandom }: MealPeriodCardProps) {
  const period = mealPeriodLabels[mealPeriod];

  return (
    <Card className="flex min-h-64 flex-col">
      <CardHeader className="pb-3">
        <span className="text-2xl" aria-hidden="true">{period.icon}</span>
        <CardTitle>{period.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {selection ? (
          <div className="mb-6">
            <p className="font-serif text-2xl font-medium">{selection.dishNameSnapshot}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              Đã chọn lúc {formatSelectionTime(selection.selectedAt, timezone)}
            </p>
          </div>
        ) : (
          <p className="mb-6 text-sm text-muted-foreground">Chưa chọn món</p>
        )}
        <Button className="mt-auto w-full" type="button" disabled={isLoading} onClick={() => onRandom(mealPeriod)}>
          {selection ? <RefreshCw className="size-4" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
          {isLoading ? 'Đang chọn…' : selection ? 'Chọn lại' : 'Chọn món'}
        </Button>
      </CardContent>
    </Card>
  );
}
