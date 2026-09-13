import type { Dish } from './api';

export type DishCatalogSort = 'name-asc' | 'name-desc';

export function filterAndSortDishes(dishes: Dish[], search: string, sort: DishCatalogSort) {
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
