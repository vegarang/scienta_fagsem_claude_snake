import type { GameState, Vec2, Direction, ExtraWall, PowerUp, ActiveEffect, PowerUpType } from './types';
import { EFFECT_DURATION } from './powerups';

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

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  createdAt: number;
}

export interface RenderOptions {
  floatingTexts?: FloatingText[];
  isNewHighScore?: boolean;
  flashSnake?: boolean;
  suppressOverlay?: boolean;
  countdownValue?: number;
  now?: number;
}

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
  lines: string[],
  colors: RendererConfig['colors'],
): void {
  ctx.fillStyle = colors.overlay;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';

  ctx.font = 'bold 32px monospace';
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = '16px monospace';
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, canvas.height / 2 + 16 + i * 22);
  });
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

const POWERUP_COLORS: Record<PowerUpType, string> = {
  speed_boost: '#FFD700',
  slow_down: '#00BFFF',
  score_multiplier: '#FF69B4',
  shrink: '#7CFC00',
  ghost_mode: '#9370DB',
};

const POWERUP_LABELS: Record<PowerUpType, string> = {
  speed_boost: '⚡',
  slow_down: '❄',
  score_multiplier: '×2',
  shrink: '✂',
  ghost_mode: '◈',
};

function drawPowerUp(ctx: CanvasRenderingContext2D, powerup: PowerUp, cellSize: number): void {
  const cx = powerup.pos.x * cellSize + cellSize / 2;
  const cy = powerup.pos.y * cellSize + cellSize / 2;
  const r = cellSize / 2 - 2;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = POWERUP_COLORS[powerup.type];
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.font = `bold ${Math.floor(cellSize * 0.5)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(POWERUP_LABELS[powerup.type], cx, cy);
  ctx.textBaseline = 'alphabetic';
}

type RRCtx = CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void };

function drawEffectsHUD(
  ctx: CanvasRenderingContext2D,
  activeEffects: readonly ActiveEffect[],
  canvas: HTMLCanvasElement,
): void {
  if (activeEffects.length === 0) return;

  const pillW = 52;
  const pillH = 20;
  const gap = 4;
  const baseY = canvas.height - gap - pillH;

  for (let i = 0; i < activeEffects.length; i++) {
    const effect = activeEffects[i];
    const x = gap + i * (pillW + gap);
    const color = POWERUP_COLORS[effect.type];
    const progress = effect.remainingTicks / EFFECT_DURATION;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    (ctx as RRCtx).roundRect(x, baseY, pillW, pillH, 4);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    (ctx as RRCtx).roundRect(x, baseY, Math.max(2, pillW * progress), pillH, 4);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(POWERUP_LABELS[effect.type], x + pillW / 2, baseY + pillH / 2);
    ctx.textBaseline = 'alphabetic';
  }
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

  ctx.fillStyle = colors.snakeBody;
  for (let i = snake.length - 1; i >= 1; i--) {
    const { x, y } = snake[i];
    ctx.beginPath();
    (ctx as CanvasRenderingContext2D & { roundRect: (...args: unknown[]) => void }).roundRect(
      x * CS + 1, y * CS + 1, CS - 2, CS - 2, 4
    );
    ctx.fill();

    const next = snake[i - 1];
    const dx = next.x - x;
    const dy = next.y - y;
    if (Math.abs(dx) === 1 && dy === 0) {
      const stripX = dx > 0 ? x * CS + CS - 2 : next.x * CS + CS - 2;
      ctx.fillRect(stripX, y * CS + 1, 4, CS - 2);
    } else if (Math.abs(dy) === 1 && dx === 0) {
      const stripY = dy > 0 ? y * CS + CS - 2 : next.y * CS + CS - 2;
      ctx.fillRect(x * CS + 1, stripY, CS - 2, 4);
    }
  }

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

  const tx = hcx + dx * (CS / 2 - 1);
  const ty = hcy + dy * (CS / 2 - 1);
  ctx.strokeStyle = '#ff2255';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx + dx * 4, ty + dy * 4);
  const fx = tx + dx * 4;
  const fy = ty + dy * 4;
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + dx * 3 + dy * 2, fy + dy * 3 + dx * 2);
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + dx * 3 - dy * 2, fy + dy * 3 - dx * 2);
  ctx.stroke();
}

function drawFloatingTexts(
  ctx: CanvasRenderingContext2D,
  texts: FloatingText[],
  now: number,
  colors: RendererConfig['colors'],
): void {
  const DURATION = 600;
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px monospace';
  for (const ft of texts) {
    const progress = Math.min((now - ft.createdAt) / DURATION, 1);
    const opacity = 1 - progress;
    const yOffset = progress * 28;
    ctx.globalAlpha = opacity;
    ctx.fillStyle = colors.text;
    ctx.fillText(ft.text, ft.x, ft.y - yOffset);
  }
  ctx.globalAlpha = 1;
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  config: RendererConfig = DEFAULT_CONFIG,
  opts: RenderOptions = {},
): void {
  const { cellSize, colors } = config;
  const canvas = ctx.canvas;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.level.wallBehavior === 'die') {
    drawBoundaryWall(ctx, canvas, colors.wall);
  }

  drawWalls(ctx, [...state.level.extraWalls, ...state.dynamicWalls], cellSize, colors.wall);

  drawApple(ctx, state.food, cellSize, colors);

  for (const powerup of state.powerups) {
    drawPowerUp(ctx, powerup, cellSize);
  }

  const snakeColors = opts.flashSnake
    ? { ...colors, snakeHead: '#ff4444', snakeBody: '#cc2222' }
    : colors;
  drawSnake(ctx, state.snake, state.direction, cellSize, snakeColors);

  drawEffectsHUD(ctx, state.activeEffects, canvas);

  if (opts.floatingTexts && opts.floatingTexts.length > 0 && opts.now !== undefined) {
    drawFloatingTexts(ctx, opts.floatingTexts, opts.now, colors);
  }

  ctx.fillStyle = colors.text;
  ctx.textAlign = 'left';
  ctx.font = '14px monospace';
  ctx.fillText(`Score: ${state.score}`, 6, 16);
  ctx.fillText(state.level.name, canvas.width - 60, 16);

  if (!opts.suppressOverlay) {
    if (state.phase === 'idle') {
      drawOverlay(ctx, canvas, 'SNAKE', ['Press Space to start'], colors);
    } else if (state.phase === 'countdown') {
      const val = opts.countdownValue ?? 3;
      drawOverlay(ctx, canvas, String(val), ['Get ready…'], colors);
    } else if (state.phase === 'paused') {
      drawOverlay(ctx, canvas, 'PAUSED', ['Press Space to resume'], colors);
    } else if (state.phase === 'gameover') {
      const statsLine = `Length: ${state.maxLength} · Ticks: ${state.ticksAlive}`;
      if (opts.isNewHighScore) {
        drawOverlay(ctx, canvas, 'NEW HIGH SCORE!', [
          `Score: ${state.score}`,
          statsLine,
          'Space to restart',
        ], colors);
      } else {
        drawOverlay(ctx, canvas, 'GAME OVER', [
          `Score: ${state.score} — Space to restart`,
          statsLine,
        ], colors);
      }
    }
  }
}
