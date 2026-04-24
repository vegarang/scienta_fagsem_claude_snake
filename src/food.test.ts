import { describe, it, expect } from 'vitest';
import { placeFood } from './food';
import { samePos, hitsExtraWall } from './snake';
import type { Vec2, ExtraWall } from './types';

const GRID: Vec2 = { x: 20, y: 20 };

describe('placeFood', () => {
  it('returns a position within grid bounds', () => {
    const food = placeFood([], [], GRID);
    expect(food.x).toBeGreaterThanOrEqual(0);
    expect(food.x).toBeLessThan(GRID.x);
    expect(food.y).toBeGreaterThanOrEqual(0);
    expect(food.y).toBeLessThan(GRID.y);
  });

  it('does not overlap any snake segment', () => {
    const snake: Vec2[] = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    for (let i = 0; i < 20; i++) {
      const food = placeFood(snake, [], GRID);
      expect(snake.some((s) => samePos(s, food))).toBe(false);
    }
  });

  it('does not overlap extra walls', () => {
    const walls: ExtraWall[] = [{ from: { x: 5, y: 5 }, to: { x: 5, y: 14 } }];
    for (let i = 0; i < 20; i++) {
      const food = placeFood([], walls, GRID);
      expect(hitsExtraWall(food, walls)).toBe(false);
    }
  });

  it('is deterministic with a fixed rng', () => {
    const rng = () => 0.5;
    const a = placeFood([], [], GRID, rng);
    const b = placeFood([], [], GRID, rng);
    expect(a).toEqual(b);
  });

  it('places food at different positions with different rng values', () => {
    const a = placeFood([], [], GRID, () => 0.1);
    const b = placeFood([], [], GRID, () => 0.9);
    expect(samePos(a, b)).toBe(false);
  });

  it('throws when there is no space for food', () => {
    const fullSnake: Vec2[] = [];
    for (let x = 0; x < GRID.x; x++) {
      for (let y = 0; y < GRID.y; y++) {
        fullSnake.push({ x, y });
      }
    }
    expect(() => placeFood(fullSnake, [], GRID)).toThrow('No space for food');
  });
});
