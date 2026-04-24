import { describe, it, expect } from 'vitest';
import { nextHead, moveSnake, hasSelfCollision, hitsExtraWall, samePos } from './snake';
import type { Vec2, ExtraWall } from './types';

const GRID: Vec2 = { x: 20, y: 20 };

describe('samePos', () => {
  it('returns true for equal positions', () => {
    expect(samePos({ x: 3, y: 4 }, { x: 3, y: 4 })).toBe(true);
  });
  it('returns false for different positions', () => {
    expect(samePos({ x: 3, y: 4 }, { x: 3, y: 5 })).toBe(false);
  });
});

describe('nextHead', () => {
  it('moves UP', () => {
    expect(nextHead({ x: 5, y: 5 }, 'UP', GRID, 'die')).toEqual({ x: 5, y: 4 });
  });
  it('moves DOWN', () => {
    expect(nextHead({ x: 5, y: 5 }, 'DOWN', GRID, 'die')).toEqual({ x: 5, y: 6 });
  });
  it('moves LEFT', () => {
    expect(nextHead({ x: 5, y: 5 }, 'LEFT', GRID, 'die')).toEqual({ x: 4, y: 5 });
  });
  it('moves RIGHT', () => {
    expect(nextHead({ x: 5, y: 5 }, 'RIGHT', GRID, 'die')).toEqual({ x: 6, y: 5 });
  });

  it('returns null at left edge in die mode', () => {
    expect(nextHead({ x: 0, y: 5 }, 'LEFT', GRID, 'die')).toBeNull();
  });
  it('returns null at right edge in die mode', () => {
    expect(nextHead({ x: 19, y: 5 }, 'RIGHT', GRID, 'die')).toBeNull();
  });
  it('returns null at top edge in die mode', () => {
    expect(nextHead({ x: 5, y: 0 }, 'UP', GRID, 'die')).toBeNull();
  });
  it('returns null at bottom edge in die mode', () => {
    expect(nextHead({ x: 5, y: 19 }, 'DOWN', GRID, 'die')).toBeNull();
  });

  it('wraps left to right edge in wrap mode', () => {
    expect(nextHead({ x: 0, y: 5 }, 'LEFT', GRID, 'wrap')).toEqual({ x: 19, y: 5 });
  });
  it('wraps right to left edge in wrap mode', () => {
    expect(nextHead({ x: 19, y: 5 }, 'RIGHT', GRID, 'wrap')).toEqual({ x: 0, y: 5 });
  });
  it('wraps top to bottom edge in wrap mode', () => {
    expect(nextHead({ x: 5, y: 0 }, 'UP', GRID, 'wrap')).toEqual({ x: 5, y: 19 });
  });
  it('wraps bottom to top edge in wrap mode', () => {
    expect(nextHead({ x: 5, y: 19 }, 'DOWN', GRID, 'wrap')).toEqual({ x: 5, y: 0 });
  });
});

describe('moveSnake', () => {
  const snake: Vec2[] = [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
  ];

  it('prepends new head and removes tail when not growing', () => {
    const result = moveSnake(snake, { x: 6, y: 5 }, false);
    expect(result).toEqual([{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }]);
  });

  it('prepends new head and keeps tail when growing', () => {
    const result = moveSnake(snake, { x: 6, y: 5 }, true);
    expect(result).toEqual([{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }]);
  });
});

describe('hasSelfCollision', () => {
  it('returns false for a normal snake', () => {
    const snake: Vec2[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    expect(hasSelfCollision(snake)).toBe(false);
  });

  it('returns true when head overlaps a body segment', () => {
    const snake: Vec2[] = [{ x: 4, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }];
    expect(hasSelfCollision(snake)).toBe(true);
  });
});

describe('hitsExtraWall', () => {
  const walls: ExtraWall[] = [{ from: { x: 5, y: 5 }, to: { x: 5, y: 10 } }];

  it('returns false when outside walls', () => {
    expect(hitsExtraWall({ x: 4, y: 7 }, walls)).toBe(false);
  });

  it('returns true for a position inside a wall rectangle', () => {
    expect(hitsExtraWall({ x: 5, y: 7 }, walls)).toBe(true);
  });

  it('returns true for a position at wall boundary', () => {
    expect(hitsExtraWall({ x: 5, y: 5 }, walls)).toBe(true);
    expect(hitsExtraWall({ x: 5, y: 10 }, walls)).toBe(true);
  });
});
