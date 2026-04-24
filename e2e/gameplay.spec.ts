import { test, expect } from '@playwright/test';
import type { GameState } from '../src/types';

declare global {
  interface Window {
    __snakeDebug: { getState: () => GameState; setState: (s: GameState) => void };
  }
}

test.describe('Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('pressing Space starts the game', async ({ page }) => {
    const stateBefore = await page.evaluate(() => window.__snakeDebug.getState().phase);
    expect(stateBefore).toBe('idle');

    await page.keyboard.press('Space');

    const stateAfter = await page.evaluate(() => window.__snakeDebug.getState().phase);
    expect(stateAfter).toBe('playing');
  });

  test('pressing Space while playing pauses the game', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    const phase = await page.evaluate(() => window.__snakeDebug.getState().phase);
    expect(phase).toBe('paused');
  });

  test('pressing Space while paused resumes the game', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    const phase = await page.evaluate(() => window.__snakeDebug.getState().phase);
    expect(phase).toBe('playing');
  });

  test('arrow key queues direction change', async ({ page }) => {
    await page.keyboard.press('Space');
    const dirBefore = await page.evaluate(() => window.__snakeDebug.getState().direction);
    expect(dirBefore).toBe('RIGHT');

    await page.keyboard.press('ArrowUp');
    const pending = await page.evaluate(() => window.__snakeDebug.getState().pendingDirection);
    expect(pending).toBe('UP');
  });

  test('score increments when snake eats food', async ({ page }) => {
    await page.keyboard.press('Space');

    // Place snake in a known safe position and food directly in front
    await page.evaluate(() => {
      const state = window.__snakeDebug.getState();
      window.__snakeDebug.setState({
        ...state,
        snake: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
        direction: 'RIGHT',
        pendingDirection: 'RIGHT',
        food: { x: 6, y: 10 },
      });
    });

    await page.waitForFunction(() => window.__snakeDebug.getState().score > 0, { timeout: 5000 });

    const scoreEl = page.getByTestId('score');
    await expect(scoreEl).not.toHaveText('0');
  });
});
