import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { CardContent } from '../../components/ui/card';
import { type Dish } from './api';
import { DishCard } from './DishCard';
import { useCopySharedDishMutation, useToggleSharedDishMutation } from './queries';

interface SharedDishListProps {
  accessToken: string;
  userId: string;
  dishes: Dish[];
  onEdit?: (dish: Dish) => void;
}

export function SharedDishList({ accessToken, userId, dishes, onEdit }: SharedDishListProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busyDishId, setBusyDishId] = useState<string | null>(null);
  const copyMutation = useCopySharedDishMutation(accessToken, userId);
  const toggleMutation = useToggleSharedDishMutation(accessToken, userId);

  async function copy(dishId: string) {
    setBusyDishId(dishId);
    setMessage(null);
    try {
      await copyMutation.mutateAsync(dishId);
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
      await toggleMutation.mutateAsync({ dishId, isExcluded });
      setMessage(isExcluded ? 'Đã hiện lại món trong các lựa chọn của bạn.' : 'Đã ẩn món khỏi các lựa chọn của bạn.');
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
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map((dish) => (
          <div key={dish.id} className="overflow-hidden rounded-3xl">
            <DishCard dish={dish} className="rounded-b-none" onEdit={onEdit ? () => onEdit(dish) : undefined} />
            <CardContent className="flex gap-2 border-x border-b border-border bg-card p-4">
              <Button className="flex-1" size="sm" disabled={busyDishId === dish.id} onClick={() => void copy(dish.id)}>
                Sao chép
              </Button>
              <Button variant="outline" size="sm" disabled={busyDishId === dish.id} onClick={() => void toggleExclusion(dish)}>
                {dish.isExcluded ? 'Hiện lại' : 'Ẩn món'}
              </Button>
            </CardContent>
          </div>
        ))}
      </div>
    </div>
  );
}
