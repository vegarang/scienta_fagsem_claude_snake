import { test, expect } from '@playwright/test';

test.describe('Canvas setup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('canvas element is visible', async ({ page }) => {
    const canvas = page.getByTestId('game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('canvas has correct dimensions', async ({ page }) => {
    const canvas = page.getByTestId('game-canvas');
    await expect(canvas).toHaveAttribute('width', '400');
    await expect(canvas).toHaveAttribute('height', '400');
  });

  test('page title is Snake', async ({ page }) => {
    await expect(page).toHaveTitle('Snake');
  });

  test('score element starts at 0', async ({ page }) => {
    const score = page.getByTestId('score');
    await expect(score).toHaveText('0');
  });
});
