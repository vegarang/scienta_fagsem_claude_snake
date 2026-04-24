import type { Vec2, ExtraWall, PowerUpType, PowerUp } from './types';
import { samePos, hitsExtraWall, allCells } from './snake';

export const POWERUP_SPAWN_MIN = 25;
export const POWERUP_SPAWN_MAX = 50;
export const POWERUP_BOARD_DURATION = 30;
export const POWERUP_DISTANCE_FACTOR = 2;
export const EFFECT_DURATION = 15;
export const POWERUP_MAX_ON_BOARD = 1;
export const SHRINK_AMOUNT = 3;

export const POWERUP_TYPES: PowerUpType[] = [
  'speed_boost',
  'slow_down',
  'score_multiplier',
  'shrink',
  'ghost_mode',
];

export function placePowerUp(
  snake: readonly Vec2[],
  walls: readonly ExtraWall[],
  powerups: readonly PowerUp[],
  food: Vec2,
  gridSize: Vec2,
  snakeHead: Vec2,
  rng: () => number = Math.random,
): PowerUp | null {
  const candidates = allCells(gridSize).filter(
    (pos) =>
      !snake.some((s) => samePos(s, pos)) &&
      !hitsExtraWall(pos, walls) &&
      !powerups.some((p) => samePos(p.pos, pos)) &&
      !samePos(pos, food),
  );
  if (candidates.length === 0) return null;
  const pos = candidates[Math.floor(rng() * candidates.length)];
  const type = POWERUP_TYPES[Math.floor(rng() * POWERUP_TYPES.length)];
  const distance = Math.abs(pos.x - snakeHead.x) + Math.abs(pos.y - snakeHead.y);
  return { type, pos, expiresInTicks: Math.max(POWERUP_BOARD_DURATION, distance * POWERUP_DISTANCE_FACTOR) };
}
