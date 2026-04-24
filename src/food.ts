import type { Vec2, ExtraWall } from './types';
import { samePos, hitsExtraWall } from './snake';

export function placeFood(
  snake: readonly Vec2[],
  walls: readonly ExtraWall[],
  gridSize: Vec2,
  rng: () => number = Math.random,
): Vec2 {
  const candidates: Vec2[] = [];
  for (let x = 0; x < gridSize.x; x++) {
    for (let y = 0; y < gridSize.y; y++) {
      const pos = { x, y };
      if (!snake.some((s) => samePos(s, pos)) && !hitsExtraWall(pos, walls)) {
        candidates.push(pos);
      }
    }
  }
  if (candidates.length === 0) throw new Error('No space for food');
  return candidates[Math.floor(rng() * candidates.length)];
}
