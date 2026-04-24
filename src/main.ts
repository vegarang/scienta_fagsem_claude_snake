import { createGame, tick, queueDirection, setPhase, getEffectiveTickInterval } from './game';
import { getLevel } from './levels';
import { getSize } from './sizes';
import { keyToDirection, shouldPreventDefault } from './input';
import { render, DEFAULT_CONFIG, type FloatingText } from './renderer';
import type { RendererConfig } from './renderer';
import { loadScoreboard, addEntry, type ScoreEntry } from './scoreboard';
import type { GameState } from './types';
import './style.css';
import { THEMES, DEFAULT_THEME_ID, DEFAULT_MODE, getThemeVariant, type ThemeId, type ColorMode } from './themes';
import { isMuted, setMuted, playEat, playPowerup, playDie } from './audio';

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
const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
const muteBtn = document.getElementById('mute-btn') as HTMLButtonElement;

const htmlEl = document.documentElement;
const modeToggle = document.getElementById('mode-toggle') as HTMLButtonElement;
const swatches = document.querySelectorAll<HTMLButtonElement>('.theme-swatch');

const LS_THEME = 'snake-theme';
const LS_MODE  = 'snake-mode';

function isValidThemeId(v: string): v is ThemeId {
  return Object.keys(THEMES).includes(v);
}

function isValidColorMode(v: string): v is ColorMode {
  return v === 'light' || v === 'dark';
}

const storedTheme = localStorage.getItem(LS_THEME);
const storedMode = localStorage.getItem(LS_MODE);
let currentThemeId: ThemeId = storedTheme && isValidThemeId(storedTheme) ? storedTheme : DEFAULT_THEME_ID;
let currentMode: ColorMode  = storedMode && isValidColorMode(storedMode) ? storedMode : DEFAULT_MODE;
let rendererConfig: RendererConfig = DEFAULT_CONFIG;

function applyTheme(): void {
  htmlEl.dataset['theme'] = currentThemeId;
  htmlEl.dataset['mode']  = currentMode;
  modeToggle.textContent  = currentMode === 'dark' ? '☀️' : '🌙';
  swatches.forEach(btn => btn.classList.toggle('active', btn.dataset['themeId'] === currentThemeId));
  const variant = getThemeVariant(currentThemeId, currentMode);
  rendererConfig = { ...DEFAULT_CONFIG, colors: { ...DEFAULT_CONFIG.colors, ...variant.canvas } };
  localStorage.setItem(LS_THEME, currentThemeId);
  localStorage.setItem(LS_MODE,  currentMode);
}

modeToggle.addEventListener('click', () => {
  currentMode = currentMode === 'dark' ? 'light' : 'dark';
  applyTheme();
});
swatches.forEach(btn => btn.addEventListener('click', () => {
  currentThemeId = btn.dataset['themeId'] as ThemeId;
  applyTheme();
}));

let levelId = new URLSearchParams(location.search).get('level') ?? 'easy';
let sizeId = new URLSearchParams(location.search).get('size') ?? 'small';
let grid = getSize(sizeId).grid;

let state: GameState = createGame(getLevel(levelId), grid);
let prevPhase = state.phase;

// --- UX state ---
let floatingTexts: FloatingText[] = [];
let countdownStartTime: number | null = null;
const COUNTDOWN_SECS = 3;
let dyingStartTime: number | null = null;
const DYING_DURATION_MS = 500;
let dyingUIShown = false;
let isNewHighScore = false;

function checkIsNewHighScore(score: number): boolean {
  if (score === 0) return false;
  const entries = loadScoreboard();
  return entries.length === 0 || score >= entries[0].score;
}

function updateDropdowns(): void {
  const locked = state.phase === 'playing' || state.phase === 'paused' || state.phase === 'countdown';
  difficultySelect.disabled = locked;
  sizeSelect.disabled = locked;
}

function updatePauseBtn(): void {
  const active = state.phase === 'playing' || state.phase === 'paused';
  pauseBtn.hidden = !active;
  pauseBtn.textContent = state.phase === 'paused' ? '▶' : '⏸';
  pauseBtn.setAttribute('aria-label', state.phase === 'paused' ? 'Resume' : 'Pause');
}

function startCountdown(): void {
  dyingStartTime = null;
  dyingUIShown = false;
  nameEntryEl.hidden = true;
  prevPhase = 'idle';
  state = { ...createGame(getLevel(levelId), grid), phase: 'countdown' };
  countdownStartTime = performance.now();
  floatingTexts = [];
  updateDropdowns();
  updatePauseBtn();
}

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

const cellSize = DEFAULT_CONFIG.cellSize;

function fitCanvas(): void {
  const scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height, 1);
  canvas.style.width  = `${Math.round(canvas.width  * scale)}px`;
  canvas.style.height = `${Math.round(canvas.height * scale)}px`;
}

function applySize(id: string): void {
  const cfg = getSize(id);
  grid = cfg.grid;
  canvas.width  = cfg.grid.x * cellSize;
  canvas.height = cfg.grid.y * cellSize;
  fitCanvas();
  state = createGame(getLevel(levelId), grid);
  floatingTexts = [];
  updateDropdowns();
  updatePauseBtn();
}

difficultySelect.value = levelId;
sizeSelect.value = sizeId;

difficultySelect.addEventListener('change', () => {
  levelId = difficultySelect.value;
  statDifficultyEl.textContent = getLevel(levelId).name;
  state = createGame(getLevel(levelId), grid);
  floatingTexts = [];
});

sizeSelect.addEventListener('change', () => {
  sizeId = sizeSelect.value;
  applySize(sizeId);
});

applyTheme();
applySize(sizeId);

window.addEventListener('resize', fitCanvas);

// Mute button
muteBtn.textContent = isMuted() ? '🔇' : '🔊';
muteBtn.addEventListener('click', () => {
  setMuted(!isMuted());
  muteBtn.textContent = isMuted() ? '🔇' : '🔊';
});

// Pause button
pauseBtn.addEventListener('click', () => {
  if (state.phase === 'playing') {
    state = setPhase(state, 'paused');
  } else if (state.phase === 'paused') {
    state = setPhase(state, 'playing');
  }
  updatePauseBtn();
});

let lastTimestamp = 0;
let accumulator = 0;

function loop(timestamp: number): void {
  const delta = Math.min(timestamp - lastTimestamp, 200);
  lastTimestamp = timestamp;
  accumulator += delta;

  // Handle countdown phase (time-based, not tick-based)
  let countdownValue = 0;
  if (state.phase === 'countdown' && countdownStartTime !== null) {
    const elapsed = performance.now() - countdownStartTime;
    countdownValue = Math.max(1, COUNTDOWN_SECS - Math.floor(elapsed / 1000));
    if (elapsed >= COUNTDOWN_SECS * 1000) {
      state = { ...state, phase: 'playing' };
      countdownStartTime = null;
      accumulator = 0;
      updateDropdowns();
      updatePauseBtn();
    }
  }

  // Process game ticks
  while (accumulator >= getEffectiveTickInterval(state)) {
    accumulator -= getEffectiveTickInterval(state);
    if (state.phase === 'playing') {
      const prevScore = state.score;
      const prevFood = state.food;
      const prevActiveCount = state.activeEffects.length;
      const prevActiveEffects = state.activeEffects;
      const prevSnakeLen = state.snake.length;

      state = tick(state);

      if (state.score > prevScore) {
        const gained = state.score - prevScore;
        floatingTexts.push({
          x: prevFood.x * cellSize + cellSize / 2,
          y: prevFood.y * cellSize + cellSize / 2,
          text: `+${gained}`,
          createdAt: timestamp,
        });
        playEat();
      }

      if (state.phase === 'playing') {
        if (state.snake.length < prevSnakeLen) {
          playPowerup('shrink');
        } else if (state.activeEffects.length > prevActiveCount) {
          const newEffect = state.activeEffects.find(e => !prevActiveEffects.some(p => p.type === e.type));
          if (newEffect) playPowerup(newEffect.type);
        }
      }
    }
  }

  // Transition from playing → gameover: start dying animation
  if (state.phase === 'gameover' && prevPhase === 'playing') {
    dyingStartTime = performance.now();
    dyingUIShown = false;
    isNewHighScore = checkIsNewHighScore(state.score);
    playDie();
    updateDropdowns();
    updatePauseBtn();
  }
  prevPhase = state.phase;

  // Show gameover UI after dying animation completes
  const dyingElapsed = dyingStartTime !== null ? performance.now() - dyingStartTime : Infinity;
  const isDying = dyingElapsed < DYING_DURATION_MS;
  if (state.phase === 'gameover' && !isDying && !dyingUIShown) {
    dyingUIShown = true;
    nameEntryEl.hidden = false;
    nameInputEl.value = '';
    nameInputEl.focus();
  }

  // Flash snake during dying (alternate every ~80ms)
  const flashSnake = isDying && Math.floor(dyingElapsed / 80) % 2 === 0;

  // Remove expired floating texts
  floatingTexts = floatingTexts.filter(ft => timestamp - ft.createdAt < 600);

  render(ctx, state, rendererConfig, {
    floatingTexts,
    isNewHighScore,
    flashSnake,
    suppressOverlay: isDying,
    countdownValue,
    now: timestamp,
  });
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
      startCountdown();
    } else if (state.phase === 'countdown') {
      // Ignore space during countdown
    } else if (state.phase === 'playing') {
      state = setPhase(state, 'paused');
      updatePauseBtn();
    } else if (state.phase === 'paused') {
      state = setPhase(state, 'playing');
      updatePauseBtn();
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

// --- Touch controls ---
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const minSwipe = 20;
  if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) {
    // Tap: start/pause
    if (state.phase === 'idle' || state.phase === 'gameover') startCountdown();
    return;
  }
  let dir: import('./types').Direction;
  if (Math.abs(dx) > Math.abs(dy)) {
    dir = dx > 0 ? 'RIGHT' : 'LEFT';
  } else {
    dir = dy > 0 ? 'DOWN' : 'UP';
  }
  if (state.phase === 'playing') state = queueDirection(state, dir);
}, { passive: true });

function setupDpadButton(id: string, dir: import('./types').Direction): void {
  const btn = document.getElementById(id);
  if (!btn) return;
  const handler = (e: Event): void => {
    e.preventDefault();
    if (state.phase === 'playing') state = queueDirection(state, dir);
    else if (state.phase === 'idle' || state.phase === 'gameover') startCountdown();
  };
  btn.addEventListener('touchstart', handler, { passive: false });
  btn.addEventListener('click', handler);
}

setupDpadButton('btn-up', 'UP');
setupDpadButton('btn-down', 'DOWN');
setupDpadButton('btn-left', 'LEFT');
setupDpadButton('btn-right', 'RIGHT');

renderScoreboard();

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>)['__snakeDebug'] = {
    getState: () => state,
    setState: (s: GameState) => { state = s; },
  };
}

requestAnimationFrame(loop);
