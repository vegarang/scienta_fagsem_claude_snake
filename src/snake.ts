import type { Vec2, Direction, WallBehavior, ExtraWall } from './types';

export function samePos(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}

export function nextHead(
  head: Vec2,
  direction: Direction,
  gridSize: Vec2,
  wallBehavior: WallBehavior,
): Vec2 | null {
  const deltas: Record<Direction, Vec2> = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
  };
  const d = deltas[direction];
  const nx = head.x + d.x;
  const ny = head.y + d.y;

  if (wallBehavior === 'wrap') {
    return {
      x: (nx + gridSize.x) % gridSize.x,
      y: (ny + gridSize.y) % gridSize.y,
    };
  }

  if (nx < 0 || nx >= gridSize.x || ny < 0 || ny >= gridSize.y) {
    return null;
  }
  return { x: nx, y: ny };
}

export function moveSnake(
  snake: readonly Vec2[],
  newHead: Vec2,
  grow: boolean,
): readonly Vec2[] {
  const body = grow ? snake : snake.slice(0, -1);
  return [newHead, ...body];
}

export function hasSelfCollision(snake: readonly Vec2[]): boolean {
  const head = snake[0];
  return snake.slice(1).some((seg) => samePos(head, seg));
}

export function hitsExtraWall(pos: Vec2, walls: readonly ExtraWall[]): boolean {
  return walls.some(
    (w) =>
      pos.x >= Math.min(w.from.x, w.to.x) &&
      pos.x <= Math.max(w.from.x, w.to.x) &&
      pos.y >= Math.min(w.from.y, w.to.y) &&
      pos.y <= Math.max(w.from.y, w.to.y),
  );
}

export function allCells(gridSize: Vec2): Vec2[] {
  const cells: Vec2[] = [];
  for (let x = 0; x < gridSize.x; x++)
    for (let y = 0; y < gridSize.y; y++)
      cells.push({ x, y });
  return cells;
}
