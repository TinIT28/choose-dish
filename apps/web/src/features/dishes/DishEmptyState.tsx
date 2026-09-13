import { SearchX, UtensilsCrossed } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface DishEmptyStateProps {
  hasSearch: boolean;
  title: string;
  description: string;
  onAdd?: () => void;
}

export function DishEmptyState({ hasSearch, title, description, onAdd }: DishEmptyStateProps) {
  const Icon = hasSearch ? SearchX : UtensilsCrossed;

  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/70 px-6 py-12 text-center shadow-sm">
      <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="font-serif text-2xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {!hasSearch && onAdd && (
        <Button type="button" className="mt-6" onClick={onAdd}>
          Thêm món đầu tiên
        </Button>
      )}
    </div>
  );
}
