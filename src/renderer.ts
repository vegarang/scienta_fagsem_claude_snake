import type { GameState, Vec2, Direction, ExtraWall } from './types';

export interface RendererConfig {
  cellSize: number;
  colors: {
    background: string;
    snakeHead: string;
    snakeBody: string;
    food: string;
    foodStem: string;
    foodLeaf: string;
    wall: string;
    text: string;
    overlay: string;
  };
}

export const DEFAULT_CONFIG: RendererConfig = {
  cellSize: 20,
  colors: {
    background: '#000000',
    snakeHead: '#00ff88',
    snakeBody: '#00cc66',
    food: '#e63030',
    foodStem: '#7a4000',
    foodLeaf: '#3aaa3a',
    wall: '#888888',
    text: '#ffffff',
    overlay: 'rgba(0,0,0,0.6)',
  },
};

function fillCell(ctx: CanvasRenderingContext2D, pos: Vec2, cellSize: number, inset = 1): void {
  ctx.fillRect(
    pos.x * cellSize + inset,
    pos.y * cellSize + inset,
    cellSize - inset * 2,
    cellSize - inset * 2,
  );
}

function drawWalls(
  ctx: CanvasRenderingContext2D,
  walls: readonly ExtraWall[],
  cellSize: number,
  color: string,
): void {
  ctx.fillStyle = color;
  for (const w of walls) {
    const x1 = Math.min(w.from.x, w.to.x);
    const x2 = Math.max(w.from.x, w.to.x);
    const y1 = Math.min(w.from.y, w.to.y);
    const y2 = Math.max(w.from.y, w.to.y);
    for (let x = x1; x <= x2; x++) {
      for (let y = y1; y <= y2; y++) {
        fillCell(ctx, { x, y }, cellSize, 0);
      }
    }
  }
}

function drawBoundaryWall(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  title: string,
  subtitle: string,
  colors: RendererConfig['colors'],
): void {
  ctx.fillStyle = colors.overlay;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';

  ctx.font = 'bold 32px monospace';
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = '16px monospace';
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 16);
}

function drawApple(ctx: CanvasRenderingContext2D, food: Vec2, cellSize: number, colors: RendererConfig['colors']): void {
  const cx = food.x * cellSize + cellSize / 2;
  const cy = food.y * cellSize + cellSize / 2;
  const r = cellSize / 2 - 2;

  ctx.beginPath();
  ctx.arc(cx, cy + 1, r, 0, Math.PI * 2);
  ctx.fillStyle = colors.food;
  ctx.fill();

  ctx.fillStyle = colors.foodStem;
  ctx.fillRect(cx - 1, cy - r - 4, 2, 5);

  ctx.fillStyle = colors.foodLeaf;
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy - r - 1, 5, 2.5, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 2, 3, 2, -Math.PI / 5, 0, Math.PI * 2);
  ctx.fill();
}

function leadingOffset(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case 'UP': return { dx: 0, dy: -1 };
    case 'DOWN': return { dx: 0, dy: 1 };
    case 'LEFT': return { dx: -1, dy: 0 };
    case 'RIGHT': return { dx: 1, dy: 0 };
  }
}

function drawSnake(
  ctx: CanvasRenderingContext2D,
  snake: readonly Vec2[],
  direction: Direction,
  cellSize: number,
  colors: RendererConfig['colors'],
): void {
  const CS = cellSize;

  // Body segments (tail to head-1 so head renders on top)
  ctx.fillStyle = colors.snakeBody;
  for (let i = snake.length - 1; i >= 1; i--) {
    const { x, y } = snake[i];
    ctx.beginPath();
    (ctx as CanvasRenderingContext2D & { roundRect: (...args: unknown[]) => void }).roundRect(
      x * CS + 1, y * CS + 1, CS - 2, CS - 2, 4
    );
    ctx.fill();

    // Fill connector between this segment and the next (towards head)
    const next = snake[i - 1];
    const dx = next.x - x;
    const dy = next.y - y;
    if (Math.abs(dx) === 1 && dy === 0) {
      // horizontal neighbour
      const stripX = dx > 0 ? x * CS + CS - 2 : next.x * CS + CS - 2;
      ctx.fillRect(stripX, y * CS + 1, 4, CS - 2);
    } else if (Math.abs(dy) === 1 && dx === 0) {
      // vertical neighbour
      const stripY = dy > 0 ? y * CS + CS - 2 : next.y * CS + CS - 2;
      ctx.fillRect(x * CS + 1, stripY, CS - 2, 4);
    }
  }

  // Head
  if (snake.length === 0) return;
  const head = snake[0];
  const hx = head.x * CS;
  const hy = head.y * CS;
  const hcx = hx + CS / 2;
  const hcy = hy + CS / 2;

  ctx.fillStyle = colors.snakeHead;
  ctx.beginPath();
  (ctx as CanvasRenderingContext2D & { roundRect: (...args: unknown[]) => void }).roundRect(
    hx + 1, hy + 1, CS - 2, CS - 2, 5
  );
  ctx.fill();

  // Connect head to neck
  if (snake.length > 1) {
    const neck = snake[1];
    const ndx = head.x - neck.x;
    const ndy = head.y - neck.y;
    ctx.fillStyle = colors.snakeBody;
    if (Math.abs(ndx) === 1 && ndy === 0) {
      const stripX = ndx > 0 ? neck.x * CS + CS - 2 : head.x * CS + CS - 2;
      ctx.fillRect(stripX, hy + 1, 4, CS - 2);
    } else if (Math.abs(ndy) === 1 && ndx === 0) {
      const stripY = ndy > 0 ? neck.y * CS + CS - 2 : head.y * CS + CS - 2;
      ctx.fillRect(hx + 1, stripY, CS - 2, 4);
    }
  }

  const { dx, dy } = leadingOffset(direction);

  // Eyes
  const perpX = dy !== 0 ? 1 : 0;
  const perpY = dx !== 0 ? 1 : 0;
  const eyeBaseX = hcx + dx * (CS / 2 - 5);
  const eyeBaseY = hcy + dy * (CS / 2 - 5);
  const eyeOffsets = [-4, 4];

  for (const off of eyeOffsets) {
    const ex = eyeBaseX + perpX * off;
    const ey = eyeBaseY + perpY * off;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(ex + dx * 0.5, ey + dy * 0.5, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tongue
  const tx = hcx + dx * (CS / 2 - 1);
  const ty = hcy + dy * (CS / 2 - 1);
  ctx.strokeStyle = '#ff2255';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx + dx * 4, ty + dy * 4);
  // Fork
  const fx = tx + dx * 4;
  const fy = ty + dy * 4;
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + dx * 3 + dy * 2, fy + dy * 3 + dx * 2);
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + dx * 3 - dy * 2, fy + dy * 3 - dx * 2);
  ctx.stroke();
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  config: RendererConfig = DEFAULT_CONFIG,
): void {
  const { cellSize, colors } = config;
  const canvas = ctx.canvas;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.level.wallBehavior === 'die') {
    drawBoundaryWall(ctx, canvas, colors.wall);
  }

  drawWalls(ctx, state.level.extraWalls, cellSize, colors.wall);

  drawApple(ctx, state.food, cellSize, colors);

  drawSnake(ctx, state.snake, state.direction, cellSize, colors);

  ctx.fillStyle = colors.text;
  ctx.textAlign = 'left';
  ctx.font = '14px monospace';
  ctx.fillText(`Score: ${state.score}`, 6, 16);
  ctx.fillText(state.level.name, canvas.width - 60, 16);

  if (state.phase === 'idle') {
    drawOverlay(ctx, canvas, 'SNAKE', 'Press Space to start', colors);
  } else if (state.phase === 'paused') {
    drawOverlay(ctx, canvas, 'PAUSED', 'Press Space to resume', colors);
  } else if (state.phase === 'gameover') {
    drawOverlay(ctx, canvas, 'GAME OVER', `Score: ${state.score} — Space to restart`, colors);
  }
}
