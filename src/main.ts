import { createGame, tick, queueDirection, setPhase } from './game';
import { getLevel } from './levels';
import { keyToDirection, shouldPreventDefault } from './input';
import { render, DEFAULT_CONFIG } from './renderer';
import type { GameState } from './types';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const scoreEl = document.getElementById('score')!;
const difficultyButtons = document.querySelectorAll<HTMLButtonElement>('#difficulty button');

const GRID = { x: 20, y: 20 };
let levelId = new URLSearchParams(location.search).get('level') ?? 'easy';

let state: GameState = createGame(getLevel(levelId), GRID);

function setActiveButton(id: string): void {
  difficultyButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.level === id));
}

difficultyButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    levelId = btn.dataset.level!;
    setActiveButton(levelId);
    state = createGame(getLevel(levelId), GRID);
  });
});

setActiveButton(levelId);

let lastTimestamp = 0;
let accumulator = 0;

function loop(timestamp: number): void {
  const delta = Math.min(timestamp - lastTimestamp, 200);
  lastTimestamp = timestamp;
  accumulator += delta;

  while (accumulator >= state.tickInterval) {
    accumulator -= state.tickInterval;
    if (state.phase === 'playing') {
      state = tick(state);
    }
  }

  render(ctx, state, DEFAULT_CONFIG);
  scoreEl.textContent = String(state.score);

  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
  if (shouldPreventDefault(e.key)) e.preventDefault();

  const dir = keyToDirection(e.key);
  if (dir && state.phase === 'playing') {
    state = queueDirection(state, dir);
  }

  if (e.key === ' ') {
    if (state.phase === 'idle' || state.phase === 'gameover') {
      state = setPhase(createGame(getLevel(levelId), GRID), 'playing');
    } else if (state.phase === 'playing') {
      state = setPhase(state, 'paused');
    } else if (state.phase === 'paused') {
      state = setPhase(state, 'playing');
    }
  }
});

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>)['__snakeDebug'] = {
    getState: () => state,
    setState: (s: GameState) => {
      state = s;
    },
  };
}

requestAnimationFrame(loop);
