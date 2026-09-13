import { MoreHorizontal, Pencil, Trash2, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { cn } from '../../lib/utils';
import type { Dish } from './api';

interface DishCardProps {
  dish: Dish;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function DishCard({ dish, onEdit, onDelete, className }: DishCardProps) {
  return (
    <Card className={cn('group overflow-hidden border-transparent bg-card shadow-[0_16px_38px_-28px_rgba(36,90,69,0.65)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgba(36,90,69,0.75)]', className)}>
      <div className="relative overflow-hidden bg-muted">
        <img className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" src={dish.imageUrl} alt={dish.name} loading="lazy" />
        {(onEdit || onDelete) && (
          <div className="absolute right-3 top-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="bg-background/90 text-foreground shadow-sm backdrop-blur hover:bg-background" aria-label={`Tùy chọn cho ${dish.name}`}>
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem onSelect={onEdit}>
                    <Pencil className="mr-2 size-3.5" aria-hidden="true" /> Sửa món
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem className="text-red-800 focus:text-red-800" onSelect={onDelete}>
                    <Trash2 className="mr-2 size-3.5" aria-hidden="true" /> Xóa món
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/65 to-transparent px-4 pb-3 pt-12">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-white"><UtensilsCrossed className="size-3.5" aria-hidden="true" /> Món ăn</span>
          <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{dish.isExcluded ? 'Đang ẩn' : 'Đang dùng'}</span>
        </div>
      </div>
      <CardContent className="p-5">
        <h3 className="font-serif text-2xl font-medium tracking-tight">{dish.name}</h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{dish.shortDescription}</p>
      </CardContent>
    </Card>
  );
}
