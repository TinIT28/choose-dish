import { Label } from '../../components/ui/label';

const retentionOptions = [7, 30, 90, 365];

interface RetentionSettingProps {
  value: number;
  onChange: (value: number) => void;
}

export function RetentionSetting({ value, onChange }: RetentionSettingProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="retention-days">Lưu lịch sử trong</Label>
      <select
        id="retention-days"
        className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {retentionOptions.map((days) => <option key={days} value={days}>{days} ngày</option>)}
      </select>
      <p className="text-xs text-muted-foreground">Mặc định là 30 ngày. Bản ghi hết hạn sẽ được xóa vĩnh viễn.</p>
    </div>
  );
}
