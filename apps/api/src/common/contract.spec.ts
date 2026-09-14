import type { DishScope as ContractDishScope, MealPeriod as ContractMealPeriod, Role as ContractRole } from '@choose-dish/contract';
import { DishScope, MealPeriod, Role } from '@prisma/client';
import { describe, expect, it } from 'vitest';

/**
 * The contract hand-writes the enum unions so the web never has to depend on
 * the generated Prisma client. These checks fail the build if the schema and the
 * contract stop agreeing — in either direction.
 */
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const roleMatches: Exact<Role, ContractRole> = true;
const mealPeriodMatches: Exact<MealPeriod, ContractMealPeriod> = true;
const dishScopeMatches: Exact<DishScope, ContractDishScope> = true;

describe('contract enums', () => {
  it('declares exactly the values the schema does', () => {
    expect([roleMatches, mealPeriodMatches, dishScopeMatches]).toEqual([true, true, true]);
    expect(Object.values(Role).sort()).toEqual(['ADMIN', 'USER']);
    expect(Object.values(MealPeriod).sort()).toEqual(['BREAKFAST', 'DINNER', 'LUNCH']);
    expect(Object.values(DishScope).sort()).toEqual(['PRIVATE', 'SHARED']);
  });
});
