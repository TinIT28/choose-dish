import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const retentionOptions = [7, 30, 90, 365];

interface RetentionSettingProps {
  value: number;
  onChange: (value: number) => void;
}

export function RetentionSetting({ value, onChange }: RetentionSettingProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="retention-days">Lưu lịch sử trong</Label>
      <Select
        value={String(value)}
        onValueChange={(nextValue) => onChange(Number(nextValue))}
      >
        <SelectTrigger id="retention-days">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {retentionOptions.map((days) => (
            <SelectItem key={days} value={String(days)}>
              {days} ngày
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Mặc định là 30 ngày. Bản ghi hết hạn sẽ được xóa vĩnh viễn.</p>
    </div>
  );
}
