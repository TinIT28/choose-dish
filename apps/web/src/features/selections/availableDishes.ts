import type { Dish } from '../dishes/api';

export type DishCandidate = Pick<Dish, 'id' | 'name' | 'shortDescription' | 'imageUrl'> & {
  isExcluded?: boolean;
};

export function getAvailableDishes(dishes: DishCandidate[]) {
  const seen = new Set<string>();

  return dishes.filter((dish) => {
    if (dish.isExcluded || seen.has(dish.id)) return false;
    seen.add(dish.id);
    return true;
  });
}
