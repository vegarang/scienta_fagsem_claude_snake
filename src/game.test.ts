import { describe, it, expect } from 'vitest';
import { createGame, tick, queueDirection, setPhase } from './game';
import { LEVELS } from './levels';
import type { GameState, Vec2 } from './types';

const GRID: Vec2 = { x: 20, y: 20 };
const easyLevel = LEVELS.easy;
const mediumLevel = LEVELS.medium;

function playingGame(overrides: Partial<GameState> = {}): GameState {
  return { ...createGame(easyLevel, GRID), phase: 'playing', ...overrides };
}

describe('createGame', () => {
  it('starts in idle phase', () => {
    expect(createGame(easyLevel, GRID).phase).toBe('idle');
  });

  it('snake has length 3', () => {
    expect(createGame(easyLevel, GRID).snake.length).toBe(3);
  });

  it('score starts at 0', () => {
    expect(createGame(easyLevel, GRID).score).toBe(0);
  });

  it('uses level initialSpeed as tickInterval', () => {
    expect(createGame(easyLevel, GRID).tickInterval).toBe(easyLevel.initialSpeed);
  });

  it('food is not on the snake', () => {
    const state = createGame(easyLevel, GRID);
    const onSnake = state.snake.some((s) => s.x === state.food.x && s.y === state.food.y);
    expect(onSnake).toBe(false);
  });
});

describe('queueDirection', () => {
  it('queues a valid direction', () => {
    const state = playingGame({ direction: 'RIGHT', pendingDirection: 'RIGHT' });
    expect(queueDirection(state, 'UP').pendingDirection).toBe('UP');
  });

  it('rejects a 180-degree reversal', () => {
    const state = playingGame({ direction: 'RIGHT', pendingDirection: 'RIGHT' });
    expect(queueDirection(state, 'LEFT').pendingDirection).toBe('RIGHT');
  });

  it('rejects reversal even when pendingDirection differs from direction', () => {
    const state = playingGame({ direction: 'RIGHT', pendingDirection: 'DOWN' });
    expect(queueDirection(state, 'LEFT').pendingDirection).toBe('DOWN');
  });

  it('allows perpendicular direction once prior turn is committed', () => {
    const state = playingGame({ direction: 'UP', pendingDirection: 'UP' });
    expect(queueDirection(state, 'LEFT').pendingDirection).toBe('LEFT');
  });
});

describe('setPhase', () => {
  it('transitions idle to playing', () => {
    const state = createGame(easyLevel, GRID);
    expect(setPhase(state, 'playing').phase).toBe('playing');
  });

  it('transitions playing to paused', () => {
    const state = playingGame();
    expect(setPhase(state, 'paused').phase).toBe('paused');
  });

  it('transitions paused back to playing', () => {
    const state = setPhase(playingGame(), 'paused');
    expect(setPhase(state, 'playing').phase).toBe('playing');
  });
});

describe('tick', () => {
  it('does not change state when not playing', () => {
    const state = createGame(easyLevel, GRID);
    expect(tick(state)).toBe(state);
  });

  it('moves the snake forward one cell per tick', () => {
    const state = playingGame({ direction: 'RIGHT', pendingDirection: 'RIGHT' });
    const headBefore = state.snake[0];
    const after = tick(state);
    expect(after.snake[0].x).toBe(headBefore.x + 1);
    expect(after.snake[0].y).toBe(headBefore.y);
    expect(after.snake.length).toBe(state.snake.length);
  });

  it('commits pendingDirection on tick', () => {
    const state = playingGame({ direction: 'RIGHT', pendingDirection: 'UP' });
    const after = tick(state);
    expect(after.direction).toBe('UP');
  });

  it('grows snake and increments score when eating food', () => {
    const snake: Vec2[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    const food: Vec2 = { x: 6, y: 5 };
    const state = playingGame({ snake, food, direction: 'RIGHT', pendingDirection: 'RIGHT' });
    const after = tick(state);
    expect(after.score).toBe(1);
    expect(after.snake.length).toBe(4);
  });

  it('reduces tickInterval when eating food, clamped to minSpeed', () => {
    const snake: Vec2[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    const food: Vec2 = { x: 6, y: 5 };
    const state = playingGame({ snake, food, direction: 'RIGHT', pendingDirection: 'RIGHT' });
    const after = tick(state);
    expect(after.tickInterval).toBe(easyLevel.initialSpeed - easyLevel.speedIncrement);
  });

  it('clamps tickInterval to minSpeed', () => {
    const snake: Vec2[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    const food: Vec2 = { x: 6, y: 5 };
    const state = playingGame({
      snake,
      food,
      direction: 'RIGHT',
      pendingDirection: 'RIGHT',
      tickInterval: easyLevel.minSpeed + 1,
    });
    const after = tick(state);
    expect(after.tickInterval).toBe(easyLevel.minSpeed);
  });

  it('sets phase to gameover on self-collision', () => {
    // U-shaped snake; going DOWN moves head onto a body segment (not the tail)
    const snake: Vec2[] = [
      { x: 5, y: 5 }, // head
      { x: 4, y: 5 },
      { x: 4, y: 6 },
      { x: 5, y: 6 }, // head will land here after moving DOWN
      { x: 6, y: 6 },
      { x: 6, y: 5 }, // tail — removed during move, so collision still detected
    ];
    const state = playingGame({ snake, pendingDirection: 'DOWN' });
    const after = tick(state);
    expect(after.phase).toBe('gameover');
  });

  it('sets phase to gameover on wall collision in die mode', () => {
    const snake: Vec2[] = [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }];
    const state = {
      ...playingGame({ snake, pendingDirection: 'LEFT' }),
      level: mediumLevel,
    };
    const after = tick(state);
    expect(after.phase).toBe('gameover');
  });

  it('wraps around in easy mode without gameover', () => {
    const snake: Vec2[] = [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }];
    const state = playingGame({ snake, pendingDirection: 'LEFT' });
    const after = tick(state);
    expect(after.phase).toBe('playing');
    expect(after.snake[0].x).toBe(GRID.x - 1);
  });

  it('sets phase to gameover on extra wall collision', () => {
    const snake: Vec2[] = [{ x: 4, y: 7 }, { x: 3, y: 7 }, { x: 2, y: 7 }];
    const state = {
      ...playingGame({ snake, pendingDirection: 'RIGHT' }),
      level: LEVELS.hard,
    };
    const after = tick(state);
    expect(after.phase).toBe('gameover');
  });
});
