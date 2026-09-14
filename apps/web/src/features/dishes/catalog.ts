import type { Dish } from './api';

export type DishCatalogSort = 'name-asc' | 'name-desc';

export function filterAndSortDishes<T extends Pick<Dish, 'name' | 'shortDescription'>>(dishes: T[], search: string, sort: DishCatalogSort): T[] {
  const normalizedSearch = search.trim().toLocaleLowerCase('vi');

  return [...dishes]
    .filter((dish) => {
      if (!normalizedSearch) return true;
      return `${dish.name} ${dish.shortDescription}`.toLocaleLowerCase('vi').includes(normalizedSearch);
    })
    .sort((left, right) => {
      const comparison = left.name.localeCompare(right.name, 'vi');
      return sort === 'name-desc' ? comparison * -1 : comparison;
    });
}
