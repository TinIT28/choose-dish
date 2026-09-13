import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { copySharedDish, excludeSharedDish, includeSharedDish, type Dish } from './api';
import { DishCard } from './DishCard';

interface SharedDishListProps {
  accessToken: string;
  dishes: Dish[];
  onEdit?: (dish: Dish) => void;
}

export function SharedDishList({ accessToken, dishes, onEdit }: SharedDishListProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busyDishId, setBusyDishId] = useState<string | null>(null);

  async function copy(dishId: string) {
    setBusyDishId(dishId);
    setMessage(null);
    try {
      await copySharedDish(accessToken, dishId);
      setMessage('Đã sao chép món vào kho riêng của bạn.');
    } catch {
      setMessage('Không thể sao chép món này.');
    } finally {
      setBusyDishId(null);
    }
  }

  async function toggleExclusion(dish: Dish) {
    const { id: dishId, isExcluded } = dish;
    setBusyDishId(dishId);
    setMessage(null);
    try {
      if (isExcluded) {
        await includeSharedDish(accessToken, dishId);
        setMessage('Đã hiện lại món trong các lựa chọn của bạn.');
      } else {
        await excludeSharedDish(accessToken, dishId);
        setMessage('Đã ẩn món khỏi các lựa chọn của bạn.');
      }
    } catch {
      setMessage('Không thể ẩn món này.');
    } finally {
      setBusyDishId(null);
    }
  }

  if (dishes.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có món dùng chung nào.</p>;
  }

  return (
    <div className="space-y-4">
      {message && <p role="status" className="text-sm text-primary">{message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {dishes.map((dish) => (
          <Card key={dish.id} className="overflow-hidden">
            <DishCard dish={dish} />
            <CardContent className="flex gap-2 border-t p-4">
              {onEdit && <Button variant="outline" size="sm" onClick={() => onEdit(dish)}>Sửa</Button>}
              <Button className="flex-1" size="sm" disabled={busyDishId === dish.id} onClick={() => void copy(dish.id)}>
                Sao chép
              </Button>
              <Button variant="outline" size="sm" disabled={busyDishId === dish.id} onClick={() => void toggleExclusion(dish)}>
                {dish.isExcluded ? 'Hiện lại' : 'Ẩn món'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
