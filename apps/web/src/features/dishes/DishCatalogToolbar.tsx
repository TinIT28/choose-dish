import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { type DishCatalogSort } from './catalog';

export type DishCatalogTab = 'private' | 'shared';

interface DishCatalogToolbarProps {
  activeTab: DishCatalogTab;
  privateCount: number;
  sharedCount: number;
  search: string;
  sort: DishCatalogSort;
  onTabChange: (tab: DishCatalogTab) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: DishCatalogSort) => void;
}

export function DishCatalogToolbar({
  activeTab,
  privateCount,
  sharedCount,
  search,
  sort,
  onTabChange,
  onSearchChange,
  onSortChange,
}: DishCatalogToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Bộ sưu tập món ăn</p>
          <div role="tablist" aria-label="Loại món ăn" className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'private'}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'private' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              onClick={() => onTabChange('private')}
            >
              Món riêng <span className="ml-1 text-xs opacity-70">{privateCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'shared'}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'shared' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              onClick={() => onTabChange('shared')}
            >
              Món dùng chung <span className="ml-1 text-xs opacity-70">{sharedCount}</span>
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{activeTab === 'private' ? 'Những món chỉ bạn nhìn thấy' : 'Kho món được chọn cho mọi người'}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative block">
          <span className="sr-only">Tìm món ăn</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo tên hoặc mô tả món…"
            className="h-12 rounded-2xl border-border bg-card pl-11 shadow-sm"
          />
        </label>
        <label className="relative flex items-center">
          <SlidersHorizontal className="pointer-events-none absolute left-4 size-4 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Sắp xếp món</span>
          <Select
            value={sort}
            onValueChange={(nextSort) => onSortChange(nextSort as DishCatalogSort)}
          >
            <SelectTrigger
              aria-label="Sắp xếp món"
              className="h-12 min-w-44 rounded-2xl border-border bg-card pl-11 pr-4 text-sm font-semibold shadow-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Tên: A → Z</SelectItem>
              <SelectItem value="name-desc">Tên: Z → A</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
    </div>
  );
}
