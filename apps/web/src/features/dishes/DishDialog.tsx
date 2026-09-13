import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../components/ui/dialog';
import type { Dish } from './api';
import { DishForm } from './DishForm';

interface DishDialogProps {
  open: boolean;
  accessToken: string;
  initialDish?: Dish;
  title?: string;
  saveDish?: (input: Omit<Dish, 'id' | 'isActive'>) => Promise<Dish>;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  onSaved: (dish: Dish) => void;
}

export function DishDialog({ open, accessToken, initialDish, title, saveDish, footer, onOpenChange, onSaved }: DishDialogProps) {
  const dialogTitle = title ?? (initialDish ? 'Sửa món' : 'Thêm món');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        <DialogDescription className="sr-only">Cập nhật thông tin món ăn hoặc thêm món mới vào kho.</DialogDescription>
        <DishForm
          key={initialDish?.id ?? 'new-dish'}
          accessToken={accessToken}
          initialDish={initialDish}
          title={dialogTitle}
          saveDish={saveDish}
          onSaved={onSaved}
        />
        {footer && <div className="border-t border-border pt-4">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
