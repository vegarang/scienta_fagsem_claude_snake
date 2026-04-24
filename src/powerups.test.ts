import { describe, it, expect } from 'vitest';
import { placePowerUp, POWERUP_BOARD_DURATION, POWERUP_TYPES } from './powerups';
import { samePos, hitsExtraWall } from './snake';
import type { Vec2, ExtraWall, PowerUp } from './types';

const GRID: Vec2 = { x: 20, y: 20 };
const FOOD: Vec2 = { x: 0, y: 0 };

describe('placePowerUp', () => {
  it('returns null when the grid is fully occupied', () => {
    const snake: Vec2[] = [];
    for (let x = 0; x < GRID.x; x++)
      for (let y = 0; y < GRID.y; y++)
        snake.push({ x, y });
    expect(placePowerUp(snake, [], [], FOOD, GRID)).toBeNull();
  });

  it('never places on a snake segment', () => {
    const snake: Vec2[] = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    for (let i = 0; i < 20; i++) {
      const p = placePowerUp(snake, [], [], FOOD, GRID);
      expect(snake.some(s => samePos(s, p!.pos))).toBe(false);
    }
  });

  it('never places on an extra wall cell', () => {
    const walls: ExtraWall[] = [{ from: { x: 5, y: 5 }, to: { x: 5, y: 14 } }];
    for (let i = 0; i < 20; i++) {
      const p = placePowerUp([], walls, [], FOOD, GRID);
      expect(hitsExtraWall(p!.pos, walls)).toBe(false);
    }
  });

  it('never places on food', () => {
    const food: Vec2 = { x: 10, y: 10 };
    for (let i = 0; i < 20; i++) {
      const p = placePowerUp([], [], [], food, GRID);
      expect(samePos(p!.pos, food)).toBe(false);
    }
  });

  it('never places on an existing powerup', () => {
    const existing: PowerUp[] = [{ type: 'speed_boost', pos: { x: 5, y: 5 }, expiresInTicks: 10 }];
    for (let i = 0; i < 20; i++) {
      const p = placePowerUp([], [], existing, FOOD, GRID);
      expect(samePos(p!.pos, existing[0].pos)).toBe(false);
    }
  });

  it('returns a PowerUp with correct structure', () => {
    const p = placePowerUp([], [], [], FOOD, GRID);
    expect(p).not.toBeNull();
    expect(typeof p!.pos.x).toBe('number');
    expect(typeof p!.pos.y).toBe('number');
    expect(p!.expiresInTicks).toBe(POWERUP_BOARD_DURATION);
  });

  it('type is always a valid PowerUpType', () => {
    for (let i = 0; i < 20; i++) {
      const p = placePowerUp([], [], [], FOOD, GRID);
      expect(POWERUP_TYPES).toContain(p!.type);
    }
  });

  it('is deterministic with a fixed rng', () => {
    const rng = () => 0.5;
    const a = placePowerUp([], [], [], FOOD, GRID, rng);
    const b = placePowerUp([], [], [], FOOD, GRID, rng);
    expect(a).toEqual(b);
  });

  it('places at different positions with different rng values', () => {
    const a = placePowerUp([], [], [], FOOD, GRID, () => 0.1);
    const b = placePowerUp([], [], [], FOOD, GRID, () => 0.9);
    expect(samePos(a!.pos, b!.pos)).toBe(false);
  });
});
