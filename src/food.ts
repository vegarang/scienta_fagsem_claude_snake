import type { Vec2, ExtraWall } from './types';
import { samePos, hitsExtraWall, allCells } from './snake';

export function placeFood(
  snake: readonly Vec2[],
  walls: readonly ExtraWall[],
  gridSize: Vec2,
  rng: () => number = Math.random,
): Vec2 {
  const candidates = allCells(gridSize).filter(
    (pos) => !snake.some((s) => samePos(s, pos)) && !hitsExtraWall(pos, walls),
  );
  if (candidates.length === 0) throw new Error('No space for food');
  return candidates[Math.floor(rng() * candidates.length)];
}
