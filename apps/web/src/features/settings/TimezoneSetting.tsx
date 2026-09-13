import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export function TimezoneSetting({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="timezone">Múi giờ</Label>
      <Input id="timezone" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Asia/Ho_Chi_Minh" />
      <p className="text-xs text-muted-foreground">Dùng tên IANA, ví dụ Asia/Ho_Chi_Minh. Giờ chọn món sẽ được lưu theo múi giờ này.</p>
    </div>
  );
}
