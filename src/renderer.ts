import type { GameState, Vec2, ExtraWall } from './types';

export interface RendererConfig {
  cellSize: number;
  colors: {
    background: string;
    snakeHead: string;
    snakeBody: string;
    food: string;
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
    food: '#ff4444',
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

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  config: RendererConfig = DEFAULT_CONFIG,
): void {
  const { cellSize, colors } = config;
  const canvas = ctx.canvas;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawWalls(ctx, state.level.extraWalls, cellSize, colors.wall);

  ctx.fillStyle = colors.food;
  fillCell(ctx, state.food, cellSize, 2);

  for (let i = state.snake.length - 1; i >= 0; i--) {
    ctx.fillStyle = i === 0 ? colors.snakeHead : colors.snakeBody;
    fillCell(ctx, state.snake[i], cellSize);
  }

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
