import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { mealPeriodLabels } from '../selections/api';
import type { HistoryGroup } from './api';

export function HistoryTimeline({ groups, timezone }: { groups: HistoryGroup[]; timezone: string }) {
  if (groups.length === 0) {
    return <p className="text-muted-foreground">Chưa có lịch sử lựa chọn trong khoảng thời gian này.</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.localDate}>
          <CardHeader className="pb-3"><CardTitle className="text-xl">{group.localDate}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {group.selections.map((selection) => (
              <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/60 p-3" key={selection.id}>
                <div className="flex items-center gap-3">
                  <span aria-hidden="true">{mealPeriodLabels[selection.mealPeriod].icon}</span>
                  <div>
                    <p className="font-semibold">{selection.dishNameSnapshot}</p>
                    <p className="text-xs text-muted-foreground">{mealPeriodLabels[selection.mealPeriod].title}</p>
                  </div>
                </div>
                <time className="shrink-0 text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: timezone }).format(new Date(selection.selectedAt))}
                </time>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
