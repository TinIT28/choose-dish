import { expect, test } from '@playwright/test';

test('shows the daily meal picker landing screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Chọn món hôm nay' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Các bữa ăn hôm nay' })).toBeVisible();
});
