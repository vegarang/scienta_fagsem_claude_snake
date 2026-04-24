import { test, expect } from '@playwright/test';
import type { GameState } from '../src/types';

declare global {
  interface Window {
    __snakeDebug: { getState: () => GameState; setState: (s: GameState) => void };
  }
}

test.describe('Game over', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?level=medium');
  });

  test('game over state is reached when snake hits a wall', async ({ page }) => {
    await page.keyboard.press('Space');

    // Place snake at the right edge moving right — next tick will kill it (die mode)
    await page.evaluate(() => {
      const state = window.__snakeDebug.getState();
      window.__snakeDebug.setState({
        ...state,
        snake: [{ x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 }],
        direction: 'RIGHT',
      });
    });

    await page.waitForFunction(() => window.__snakeDebug.getState().phase === 'gameover', {
      timeout: 5000,
    });
  });

  test('pressing Space after game over resets the game', async ({ page }) => {
    await page.keyboard.press('Space');

    await page.evaluate(() => {
      window.__snakeDebug.setState({ ...window.__snakeDebug.getState(), phase: 'gameover' });
    });

    await page.keyboard.press('Space');

    const state = await page.evaluate(() => window.__snakeDebug.getState());
    expect(state.phase).toBe('playing');
    expect(state.score).toBe(0);
  });

  test('score resets to 0 after restart', async ({ page }) => {
    await page.keyboard.press('Space');

    await page.evaluate(() => {
      window.__snakeDebug.setState({
        ...window.__snakeDebug.getState(),
        phase: 'gameover',
        score: 5,
      });
    });

    await page.keyboard.press('Space');

    const score = await page.evaluate(() => window.__snakeDebug.getState().score);
    expect(score).toBe(0);

    const scoreEl = page.getByTestId('score');
    await expect(scoreEl).toHaveText('0');
  });
});
