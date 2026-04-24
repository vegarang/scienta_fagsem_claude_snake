import { createGame, tick, queueDirection, setPhase } from './game';
import { getLevel } from './levels';
import { getSize } from './sizes';
import { keyToDirection, shouldPreventDefault } from './input';
import { render, DEFAULT_CONFIG } from './renderer';
import { loadScoreboard, addEntry, type ScoreEntry } from './scoreboard';
import type { GameState } from './types';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const scoreEl = document.getElementById('score')!;
const statDifficultyEl = document.getElementById('stat-difficulty')!;
const difficultySelect = document.querySelector<HTMLSelectElement>('#difficulty-select')!;
const sizeSelect = document.querySelector<HTMLSelectElement>('#size-select')!;
const nameEntryEl = document.getElementById('name-entry') as HTMLElement;
const nameInputEl = document.getElementById('name-input') as HTMLInputElement;
const nameSubmitEl = document.getElementById('name-submit') as HTMLButtonElement;
const nameSkipEl = document.getElementById('name-skip') as HTMLButtonElement;
const scoreBodyEl = document.getElementById('score-body') as HTMLTableSectionElement;
const noScoresEl = document.getElementById('no-scores') as HTMLElement;
const scoreTableEl = document.getElementById('score-table') as HTMLTableElement;

let levelId = new URLSearchParams(location.search).get('level') ?? 'easy';
let sizeId = new URLSearchParams(location.search).get('size') ?? 'small';
let grid = getSize(sizeId).grid;

let state: GameState = createGame(getLevel(levelId), grid);
let prevPhase = state.phase;

function renderScoreboard(): void {
  const entries = loadScoreboard();
  scoreBodyEl.innerHTML = '';
  if (entries.length === 0) {
    scoreTableEl.hidden = true;
    noScoresEl.hidden = false;
  } else {
    scoreTableEl.hidden = false;
    noScoresEl.hidden = true;
    entries.forEach((e, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${e.name}</td><td>${e.score}</td><td>${e.date}</td>`;
      scoreBodyEl.appendChild(tr);
    });
  }
}

function fitCanvas(): void {
  const scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height, 1);
  canvas.style.width  = `${Math.round(canvas.width  * scale)}px`;
  canvas.style.height = `${Math.round(canvas.height * scale)}px`;
}

function applySize(id: string): void {
  const cfg = getSize(id);
  grid = cfg.grid;
  canvas.width  = cfg.grid.x * DEFAULT_CONFIG.cellSize;
  canvas.height = cfg.grid.y * DEFAULT_CONFIG.cellSize;
  fitCanvas();
  state = createGame(getLevel(levelId), grid);
}

difficultySelect.value = levelId;
sizeSelect.value = sizeId;

difficultySelect.addEventListener('change', () => {
  levelId = difficultySelect.value;
  statDifficultyEl.textContent = getLevel(levelId).name;
  state = createGame(getLevel(levelId), grid);
});

sizeSelect.addEventListener('change', () => {
  sizeId = sizeSelect.value;
  applySize(sizeId);
});

applySize(sizeId);

window.addEventListener('resize', fitCanvas);

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

  if (state.phase === 'gameover' && prevPhase !== 'gameover') {
    nameEntryEl.hidden = false;
    nameInputEl.value = '';
    nameInputEl.focus();
  }
  prevPhase = state.phase;

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
    if (document.activeElement === nameInputEl) return;
    if (state.phase === 'idle' || state.phase === 'gameover') {
      nameEntryEl.hidden = true;
      prevPhase = 'idle';
      state = setPhase(createGame(getLevel(levelId), grid), 'playing');
    } else if (state.phase === 'playing') {
      state = setPhase(state, 'paused');
    } else if (state.phase === 'paused') {
      state = setPhase(state, 'playing');
    }
  }
});

function submitScore(): void {
  const name = nameInputEl.value.trim();
  if (name) {
    const entry: ScoreEntry = {
      name,
      score: state.score,
      date: new Date().toISOString().slice(0, 10),
    };
    addEntry(entry);
    renderScoreboard();
  }
  nameEntryEl.hidden = true;
}

nameSubmitEl.addEventListener('click', submitScore);

nameInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitScore();
});

nameSkipEl.addEventListener('click', () => {
  nameEntryEl.hidden = true;
  renderScoreboard();
});

renderScoreboard();

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>)['__snakeDebug'] = {
    getState: () => state,
    setState: (s: GameState) => {
      state = s;
    },
  };
}

requestAnimationFrame(loop);
