import { describe, it, expect } from 'vitest';
import { placePowerUp, POWERUP_BOARD_DURATION, POWERUP_DISTANCE_FACTOR, POWERUP_TYPES } from './powerups';
import { samePos, hitsExtraWall } from './snake';
import type { Vec2, ExtraWall, PowerUp } from './types';

const GRID: Vec2 = { x: 20, y: 20 };
const FOOD: Vec2 = { x: 0, y: 0 };
const HEAD: Vec2 = { x: 0, y: 0 };

describe('placePowerUp', () => {
  it('returns null when the grid is fully occupied', () => {
    const snake: Vec2[] = [];
    for (let x = 0; x < GRID.x; x++)
      for (let y = 0; y < GRID.y; y++)
        snake.push({ x, y });
    expect(placePowerUp(snake, [], [], FOOD, GRID, HEAD)).toBeNull();
  });

  it('never places on a snake segment', () => {
    const snake: Vec2[] = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    for (let i = 0; i < 20; i++) {
      const p = placePowerUp(snake, [], [], FOOD, GRID, HEAD);
      expect(snake.some(s => samePos(s, p!.pos))).toBe(false);
    }
  });

  it('never places on an extra wall cell', () => {
    const walls: ExtraWall[] = [{ from: { x: 5, y: 5 }, to: { x: 5, y: 14 } }];
    for (let i = 0; i < 20; i++) {
      const p = placePowerUp([], walls, [], FOOD, GRID, HEAD);
      expect(hitsExtraWall(p!.pos, walls)).toBe(false);
    }
  });

  it('never places on food', () => {
    const food: Vec2 = { x: 10, y: 10 };
    for (let i = 0; i < 20; i++) {
      const p = placePowerUp([], [], [], food, GRID, HEAD);
      expect(samePos(p!.pos, food)).toBe(false);
    }
  });

  it('never places on an existing powerup', () => {
    const existing: PowerUp[] = [{ type: 'speed_boost', pos: { x: 5, y: 5 }, expiresInTicks: 10 }];
    for (let i = 0; i < 20; i++) {
      const p = placePowerUp([], [], existing, FOOD, GRID, HEAD);
      expect(samePos(p!.pos, existing[0].pos)).toBe(false);
    }
  });

  it('returns a PowerUp with correct structure', () => {
    const p = placePowerUp([], [], [], FOOD, GRID, HEAD);
    expect(p).not.toBeNull();
    expect(typeof p!.pos.x).toBe('number');
    expect(typeof p!.pos.y).toBe('number');
    expect(p!.expiresInTicks).toBeGreaterThanOrEqual(POWERUP_BOARD_DURATION);
  });

  it('type is always a valid PowerUpType', () => {
    for (let i = 0; i < 20; i++) {
      const p = placePowerUp([], [], [], FOOD, GRID, HEAD);
      expect(POWERUP_TYPES).toContain(p!.type);
    }
  });

  it('is deterministic with a fixed rng', () => {
    const rng = () => 0.5;
    const a = placePowerUp([], [], [], FOOD, GRID, HEAD, rng);
    const b = placePowerUp([], [], [], FOOD, GRID, HEAD, rng);
    expect(a).toEqual(b);
  });

  it('places at different positions with different rng values', () => {
    const a = placePowerUp([], [], [], FOOD, GRID, HEAD, () => 0.1);
    const b = placePowerUp([], [], [], FOOD, GRID, HEAD, () => 0.9);
    expect(samePos(a!.pos, b!.pos)).toBe(false);
  });

  it('scales expiresInTicks by distance from head', () => {
    const head: Vec2 = { x: 0, y: 0 };
    const p = placePowerUp([], [], [], FOOD, GRID, head, () => 0.9999);
    expect(p).not.toBeNull();
    const distance = Math.abs(p!.pos.x - head.x) + Math.abs(p!.pos.y - head.y);
    expect(p!.expiresInTicks).toBe(
      Math.max(POWERUP_BOARD_DURATION, distance * POWERUP_DISTANCE_FACTOR)
    );
  });
});
