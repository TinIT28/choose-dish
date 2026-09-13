import { Card, CardContent } from '../../components/ui/card';
import type { Dish } from './api';

export function DishCard({ dish }: { dish: Dish }) {
  return (
    <Card className="overflow-hidden">
      <img className="aspect-[4/3] w-full object-cover" src={dish.imageUrl} alt={dish.name} />
      <CardContent className="p-5">
        <h3 className="font-serif text-xl font-medium">{dish.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{dish.shortDescription}</p>
      </CardContent>
    </Card>
  );
}
