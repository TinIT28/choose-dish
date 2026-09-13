import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import type { Dish } from './api';

interface DishCardProps {
  dish: Dish;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function DishCard({ dish, onEdit, onDelete }: DishCardProps) {
  return (
    <Card className="overflow-hidden">
      <img className="aspect-[4/3] w-full object-cover" src={dish.imageUrl} alt={dish.name} />
      <CardContent className="p-5">
        <h3 className="font-serif text-xl font-medium">{dish.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{dish.shortDescription}</p>
        {(onEdit || onDelete) && (
          <div className="mt-4 flex gap-2">
            {onEdit && <Button size="sm" variant="outline" onClick={onEdit}>Sửa</Button>}
            {onDelete && <Button size="sm" variant="ghost" className="text-red-800" onClick={onDelete}>Xóa</Button>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
