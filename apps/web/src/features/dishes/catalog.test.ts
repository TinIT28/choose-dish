import { describe, expect, it } from 'vitest';
import type { Dish } from './api';
import { filterAndSortDishes } from './catalog';

const dishes: Dish[] = [
  { id: '1', name: 'Phở bò', shortDescription: 'Nước dùng trong', imageUrl: '', cloudinaryPublicId: '', isActive: true },
  { id: '2', name: 'Bún bò Huế', shortDescription: 'Cay nhẹ', imageUrl: '', cloudinaryPublicId: '', isActive: true },
  { id: '3', name: 'Cơm tấm', shortDescription: 'Sườn nướng', imageUrl: '', cloudinaryPublicId: '', isActive: true },
];

describe('dish catalog filtering', () => {
  it('matches Vietnamese text and sorts the filtered dishes without mutating the source', () => {
    const result = filterAndSortDishes(dishes, 'bò', 'name-asc');

    expect(result.map((dish) => dish.name)).toEqual(['Bún bò Huế', 'Phở bò']);
    expect(dishes.map((dish) => dish.name)).toEqual(['Phở bò', 'Bún bò Huế', 'Cơm tấm']);
  });
});
