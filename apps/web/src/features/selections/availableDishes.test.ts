import { describe, expect, it } from 'vitest';
import { getAvailableDishes, type DishCandidate } from './availableDishes';

describe('getAvailableDishes', () => {
  it('removes excluded and duplicate dishes while preserving catalog order', () => {
    const privateDish: DishCandidate = { id: 'private-1', name: 'Cơm tấm', imageUrl: '/com-tam.jpg', shortDescription: 'Cơm sườn' };
    const sharedDish: DishCandidate = { id: 'shared-1', name: 'Phở bò', imageUrl: '/pho.jpg', shortDescription: 'Nước dùng trong' };

    expect(getAvailableDishes([
      privateDish,
      { ...sharedDish, isExcluded: true },
      sharedDish,
      { ...privateDish },
    ])).toEqual([privateDish, sharedDish]);
  });
});
