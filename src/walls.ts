import type { Vec2, Direction, ExtraWall, GameState, LevelConfig } from './types';
import { hitsExtraWall, samePos } from './snake';

const MIN_WALL_FRACTION = 0.25;
const MAX_WALL_FRACTION = 0.70;
const SNAKE_SAFE_RADIUS = 5;
const LOOK_AHEAD_CELLS = 8;

export function generateInitialWalls(level: LevelConfig, gridSize: Vec2): readonly ExtraWall[] {
  if (level.id !== 'hard') return [];
  const x1 = Math.floor(gridSize.x * MIN_WALL_FRACTION);
  const x2 = Math.floor(gridSize.x * MAX_WALL_FRACTION);
  const y1 = Math.floor(gridSize.y * MIN_WALL_FRACTION);
  const y2 = Math.floor(gridSize.y * MAX_WALL_FRACTION);
  return [
    { from: { x: x1, y: y1 }, to: { x: x1, y: y2 } },
    { from: { x: x2, y: y1 }, to: { x: x2, y: y2 } },
  ];
}

function chebyshev(a: Vec2, b: Vec2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function isTooCloseToHead(pos: Vec2, head: Vec2, safeRadius = SNAKE_SAFE_RADIUS): boolean {
  return chebyshev(pos, head) < safeRadius;
}

function isInLookAheadZone(pos: Vec2, head: Vec2, direction: Direction, lookAhead = LOOK_AHEAD_CELLS): boolean {
  if (direction === 'LEFT' || direction === 'RIGHT') {
    if (Math.abs(pos.y - head.y) > 1) return false;
    const minX = direction === 'RIGHT' ? head.x : head.x - lookAhead;
    const maxX = direction === 'RIGHT' ? head.x + lookAhead : head.x;
    return pos.x >= minX && pos.x <= maxX;
  } else {
    if (Math.abs(pos.x - head.x) > 1) return false;
    const minY = direction === 'DOWN' ? head.y : head.y - lookAhead;
    const maxY = direction === 'DOWN' ? head.y + lookAhead : head.y;
    return pos.y >= minY && pos.y <= maxY;
  }
}

function wallCells(wall: ExtraWall): Vec2[] {
  const cells: Vec2[] = [];
  const x1 = Math.min(wall.from.x, wall.to.x);
  const x2 = Math.max(wall.from.x, wall.to.x);
  const y1 = Math.min(wall.from.y, wall.to.y);
  const y2 = Math.max(wall.from.y, wall.to.y);
  for (let x = x1; x <= x2; x++) {
    for (let y = y1; y <= y2; y++) {
      cells.push({ x, y });
    }
  }
  return cells;
}

export function spawnWall(state: GameState, rng: () => number): ExtraWall | null {
  const { level, gridSize, snake, food, direction, dynamicWalls } = state;
  const head = snake[0];
  const allWalls = [...level.extraWalls, ...dynamicWalls];

  for (let attempt = 0; attempt < 100; attempt++) {
    const horizontal = rng() < 0.5;
    const length = 1 + Math.floor(rng() * level.wallSpawnMaxLength);

    let from: Vec2;
    let to: Vec2;

    if (horizontal) {
      const x = Math.floor(rng() * (gridSize.x - length));
      const y = Math.floor(rng() * gridSize.y);
      from = { x, y };
      to = { x: x + length - 1, y };
    } else {
      const x = Math.floor(rng() * gridSize.x);
      const y = Math.floor(rng() * (gridSize.y - length));
      from = { x, y };
      to = { x, y: y + length - 1 };
    }

    const candidate: ExtraWall = { from, to };
    const cells = wallCells(candidate);

    const invalid = cells.some(
      (cell) =>
        hitsExtraWall(cell, allWalls) ||
        snake.some((s) => samePos(s, cell)) ||
        isTooCloseToHead(cell, head, SNAKE_SAFE_RADIUS) ||
        isInLookAheadZone(cell, head, direction, LOOK_AHEAD_CELLS) ||
        samePos(cell, food),
    );

    if (!invalid) return candidate;
  }

  return null;
}
