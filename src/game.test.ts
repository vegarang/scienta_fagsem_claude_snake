import { describe, it, expect } from 'vitest';
import { createGame, tick, queueDirection, setPhase, getEffectiveTickInterval } from './game';
import { LEVELS } from './levels';
import { POWERUP_SPAWN_MIN, EFFECT_DURATION } from './powerups';
import type { GameState, Vec2, PowerUp } from './types';

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
    const state = playingGame({ direction: 'RIGHT', directionQueue: [] });
    expect(queueDirection(state, 'UP').directionQueue).toEqual(['UP']);
  });

  it('rejects a 180-degree reversal against current direction', () => {
    const state = playingGame({ direction: 'RIGHT', directionQueue: [] });
    expect(queueDirection(state, 'LEFT').directionQueue).toEqual([]);
  });

  it('rejects reversal against last queued direction', () => {
    const state = playingGame({ direction: 'RIGHT', directionQueue: ['DOWN'] });
    expect(queueDirection(state, 'UP').directionQueue).toEqual(['DOWN']);
  });

  it('allows turn valid relative to queued direction (rapid turn fix)', () => {
    // direction=UP but RIGHT is queued; DOWN is valid from RIGHT, must not be lost
    const state = playingGame({ direction: 'UP', directionQueue: ['RIGHT'] });
    expect(queueDirection(state, 'DOWN').directionQueue).toEqual(['RIGHT', 'DOWN']);
  });

  it('ignores a 4th rapid press when queue is full', () => {
    const state = playingGame({ direction: 'RIGHT', directionQueue: ['DOWN', 'LEFT'] });
    expect(queueDirection(state, 'UP').directionQueue).toEqual(['DOWN', 'LEFT']);
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
    const state = playingGame({ direction: 'RIGHT', directionQueue: [] });
    const headBefore = state.snake[0];
    const after = tick(state);
    expect(after.snake[0].x).toBe(headBefore.x + 1);
    expect(after.snake[0].y).toBe(headBefore.y);
    expect(after.snake.length).toBe(state.snake.length);
  });

  it('consumes first queued direction on tick', () => {
    const state = playingGame({ direction: 'RIGHT', directionQueue: ['UP'] });
    const after = tick(state);
    expect(after.direction).toBe('UP');
    expect(after.directionQueue).toEqual([]);
  });

  it('retains second queued direction after tick', () => {
    const state = playingGame({ direction: 'RIGHT', directionQueue: ['DOWN', 'LEFT'] });
    const after = tick(state);
    expect(after.direction).toBe('DOWN');
    expect(after.directionQueue).toEqual(['LEFT']);
  });

  it('grows snake and increments score when eating food', () => {
    const snake: Vec2[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    const food: Vec2 = { x: 6, y: 5 };
    const state = playingGame({ snake, food, direction: 'RIGHT', directionQueue: [] });
    const after = tick(state);
    expect(after.score).toBe(1);
    expect(after.snake.length).toBe(4);
  });

  it('reduces tickInterval when eating food, clamped to minSpeed', () => {
    const snake: Vec2[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    const food: Vec2 = { x: 6, y: 5 };
    const state = playingGame({ snake, food, direction: 'RIGHT', directionQueue: [] });
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
      directionQueue: [],
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
    const state = playingGame({ snake, directionQueue: ['DOWN'] });
    const after = tick(state);
    expect(after.phase).toBe('gameover');
  });

  it('sets phase to gameover on wall collision in die mode', () => {
    const snake: Vec2[] = [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }];
    const state = {
      ...playingGame({ snake, directionQueue: ['LEFT'] }),
      level: mediumLevel,
    };
    const after = tick(state);
    expect(after.phase).toBe('gameover');
  });

  it('wraps around in easy mode without gameover', () => {
    const snake: Vec2[] = [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }];
    const state = playingGame({ snake, directionQueue: ['LEFT'] });
    const after = tick(state);
    expect(after.phase).toBe('playing');
    expect(after.snake[0].x).toBe(GRID.x - 1);
  });

  it('sets phase to gameover on extra wall collision', () => {
    const snake: Vec2[] = [{ x: 4, y: 7 }, { x: 3, y: 7 }, { x: 2, y: 7 }];
    const state = {
      ...playingGame({ snake, directionQueue: ['RIGHT'] }),
      level: LEVELS.hard,
      dynamicWalls: [{ from: { x: 5, y: 5 }, to: { x: 5, y: 14 } }],
    };
    const after = tick(state);
    expect(after.phase).toBe('gameover');
  });
});

describe('getEffectiveTickInterval', () => {
  it('returns tickInterval with no active effects', () => {
    const state = playingGame({ tickInterval: 200, activeEffects: [] });
    expect(getEffectiveTickInterval(state)).toBe(200);
  });

  it('returns tickInterval * 0.5 with speed_boost', () => {
    const state = playingGame({ tickInterval: 200, activeEffects: [{ type: 'speed_boost', remainingTicks: 5 }] });
    expect(getEffectiveTickInterval(state)).toBe(100);
  });

  it('clamps speed_boost result to 30ms minimum', () => {
    const state = playingGame({ tickInterval: 40, activeEffects: [{ type: 'speed_boost', remainingTicks: 5 }] });
    expect(getEffectiveTickInterval(state)).toBe(30);
  });

  it('returns tickInterval * 1.8 with slow_down', () => {
    const state = playingGame({ tickInterval: 200, activeEffects: [{ type: 'slow_down', remainingTicks: 5 }] });
    expect(getEffectiveTickInterval(state)).toBe(360);
  });

  it('speed_boost takes precedence over slow_down when both active', () => {
    const state = playingGame({
      tickInterval: 200,
      activeEffects: [
        { type: 'speed_boost', remainingTicks: 5 },
        { type: 'slow_down', remainingTicks: 5 },
      ],
    });
    expect(getEffectiveTickInterval(state)).toBe(100);
  });
});

describe('powerup spawning', () => {
  it('decrements powerupSpawnCountdown each tick', () => {
    const state = playingGame({ powerupSpawnCountdown: 5, food: { x: 0, y: 0 } });
    const after = tick(state);
    expect(after.powerupSpawnCountdown).toBe(4);
  });

  it('spawns a powerup when countdown reaches 0 and board is empty', () => {
    const state = playingGame({ powerupSpawnCountdown: 1, powerups: [], food: { x: 0, y: 0 } });
    const after = tick(state, () => 0);
    expect(after.powerups).toHaveLength(1);
  });

  it('does not spawn when board already has POWERUP_MAX_ON_BOARD powerups', () => {
    const existing: PowerUp = { type: 'slow_down', pos: { x: 15, y: 15 }, expiresInTicks: 20 };
    const state = playingGame({ powerupSpawnCountdown: 1, powerups: [existing], food: { x: 0, y: 0 } });
    const after = tick(state, () => 0);
    expect(after.powerups).toHaveLength(1);
  });

  it('resets countdown to POWERUP_SPAWN_MIN after spawn with rng=0', () => {
    const state = playingGame({ powerupSpawnCountdown: 1, powerups: [], food: { x: 0, y: 0 } });
    const after = tick(state, () => 0);
    expect(after.powerupSpawnCountdown).toBe(POWERUP_SPAWN_MIN);
  });
});

describe('powerup expiry', () => {
  it('decrements expiresInTicks on board powerups each tick', () => {
    const powerup: PowerUp = { type: 'speed_boost', pos: { x: 15, y: 15 }, expiresInTicks: 5 };
    const state = playingGame({ powerups: [powerup], food: { x: 0, y: 0 } });
    const after = tick(state);
    expect(after.powerups[0].expiresInTicks).toBe(4);
  });

  it('removes powerup from board when expiresInTicks reaches 0', () => {
    const powerup: PowerUp = { type: 'speed_boost', pos: { x: 15, y: 15 }, expiresInTicks: 1 };
    const state = playingGame({ powerups: [powerup], food: { x: 0, y: 0 } });
    const after = tick(state);
    expect(after.powerups).toHaveLength(0);
  });
});

describe('powerup collection', () => {
  it('shrink reduces snake length by SHRINK_AMOUNT', () => {
    const snake: Vec2[] = [
      { x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }, { x: 2, y: 5 }, { x: 1, y: 5 },
    ];
    const shrinkPowerup: PowerUp = { type: 'shrink', pos: { x: 6, y: 5 }, expiresInTicks: 30 };
    const state = playingGame({ snake, powerups: [shrinkPowerup], direction: 'RIGHT', food: { x: 0, y: 0 } });
    const after = tick(state);
    expect(after.snake.length).toBe(2); // moveSnake gives 5, shrink: max(1, 5-3) = 2
  });

  it('shrink does not reduce snake below length 1', () => {
    const snake: Vec2[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
    const shrinkPowerup: PowerUp = { type: 'shrink', pos: { x: 6, y: 5 }, expiresInTicks: 30 };
    const state = playingGame({ snake, powerups: [shrinkPowerup], direction: 'RIGHT', food: { x: 0, y: 0 } });
    const after = tick(state);
    expect(after.snake.length).toBe(1);
  });

  it('removes collected powerup from board', () => {
    const snake: Vec2[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    const powerup: PowerUp = { type: 'speed_boost', pos: { x: 6, y: 5 }, expiresInTicks: 30 };
    const state = playingGame({ snake, powerups: [powerup], direction: 'RIGHT', food: { x: 0, y: 0 } });
    const after = tick(state);
    expect(after.powerups).toHaveLength(0);
  });

  it('adds timed effect to activeEffects with EFFECT_DURATION ticks', () => {
    const snake: Vec2[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    const powerup: PowerUp = { type: 'speed_boost', pos: { x: 6, y: 5 }, expiresInTicks: 30 };
    const state = playingGame({ snake, powerups: [powerup], direction: 'RIGHT', food: { x: 0, y: 0 } });
    const after = tick(state);
    expect(after.activeEffects).toHaveLength(1);
    expect(after.activeEffects[0].type).toBe('speed_boost');
    expect(after.activeEffects[0].remainingTicks).toBe(EFFECT_DURATION);
  });
});

describe('active effect aging', () => {
  it('decrements remainingTicks each tick', () => {
    const state = playingGame({ activeEffects: [{ type: 'speed_boost', remainingTicks: 5 }], food: { x: 0, y: 0 } });
    const after = tick(state);
    expect(after.activeEffects[0].remainingTicks).toBe(4);
  });

  it('removes effect when remainingTicks reaches 0', () => {
    const state = playingGame({ activeEffects: [{ type: 'speed_boost', remainingTicks: 1 }], food: { x: 0, y: 0 } });
    const after = tick(state);
    expect(after.activeEffects).toHaveLength(0);
  });
});

describe('score_multiplier effect', () => {
  it('doubles score when eating food with score_multiplier active', () => {
    const snake: Vec2[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    const food: Vec2 = { x: 6, y: 5 };
    const state = playingGame({
      snake,
      food,
      direction: 'RIGHT',
      activeEffects: [{ type: 'score_multiplier', remainingTicks: 10 }],
    });
    const after = tick(state);
    expect(after.score).toBe(2);
  });
});

describe('ghost_mode effect', () => {
  it('prevents gameover when hitting boundary on die-mode level', () => {
    const snake: Vec2[] = [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }];
    const state = {
      ...playingGame({
        snake,
        direction: 'LEFT',
        food: { x: 19, y: 19 },
        activeEffects: [{ type: 'ghost_mode', remainingTicks: 10 }],
      }),
      level: mediumLevel,
    };
    const after = tick(state);
    expect(after.phase).toBe('playing');
    expect(after.snake[0].x).toBe(GRID.x - 1);
  });

  it('prevents gameover when hitting an extra wall', () => {
    const snake: Vec2[] = [{ x: 4, y: 7 }, { x: 3, y: 7 }, { x: 2, y: 7 }];
    const state = {
      ...playingGame({
        snake,
        direction: 'RIGHT',
        food: { x: 19, y: 19 },
        activeEffects: [{ type: 'ghost_mode', remainingTicks: 10 }],
      }),
      level: LEVELS.hard,
      dynamicWalls: [{ from: { x: 5, y: 5 }, to: { x: 5, y: 14 } }],
    };
    const after = tick(state);
    expect(after.phase).toBe('playing');
    expect(after.snake[0]).toEqual({ x: 5, y: 7 });
  });

  it('snake dies on wall collision after ghost_mode expires', () => {
    const snake: Vec2[] = [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }];
    const state = {
      ...playingGame({
        snake,
        direction: 'LEFT',
        food: { x: 19, y: 19 },
        activeEffects: [{ type: 'ghost_mode', remainingTicks: 1 }],
      }),
      level: mediumLevel,
    };
    const after = tick(state);
    expect(after.phase).toBe('gameover');
  });
});
