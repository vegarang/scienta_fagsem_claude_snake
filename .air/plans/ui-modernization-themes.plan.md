# UI Refresh — Modern Design with Themes & Dark/Light Mode

## Context

The game currently has all CSS inlined in `index.html` using a hardcoded dark neon-green aesthetic with monospace fonts everywhere. Canvas rendering colors are also hardcoded in `renderer.ts`. The user wants a clean modern design with a light/dark mode toggle and multiple selectable color themes that affect both the page UI and the canvas rendering.

---

## Approach

Use **CSS custom properties** (`--var`) declared per `[data-theme][data-mode]` attribute combinations on `<html>`. A new `src/themes.ts` file holds the matching TypeScript objects that supply canvas colors to the renderer. `main.ts` reads/writes `localStorage` for persistence and sets the attributes and renderer config on theme change. This keeps all styling in one CSS file, keeps canvas logic in the existing `RendererConfig` interface (extended with two new fields), and leaves all game-logic files untouched.

---

## Files

| File | Change |
|---|---|
| `src/style.css` | **Create** — all page CSS with custom property themes |
| `src/themes.ts` | **Create** — 5 themes × 2 modes = 10 canvas + CSS palettes |
| `index.html` | **Rewrite** — remove inline `<style>`, add theme-controls UI, link CSS via import |
| `src/renderer.ts` | **Modify** — add `foodStem`/`foodLeaf` to `RendererConfig['colors']`, thread into `drawApple` |
| `src/main.ts` | **Modify** — `import './style.css'`, wire `applyTheme()`, replace `DEFAULT_CONFIG` usage |

---

## Implementation Steps

### Task 1 — Create `src/themes.ts`

Define and export:

```ts
export type ThemeId = 'classic' | 'ocean' | 'sunset' | 'forest' | 'minimal';
export type ColorMode = 'dark' | 'light';

export interface CanvasColors {
  background: string; snakeHead: string; snakeBody: string;
  food: string; foodStem: string; foodLeaf: string;
  wall: string; text: string; overlay: string;
}
export interface CssVars {
  '--bg': string; '--surface': string; '--surface2': string; '--border': string;
  '--text': string; '--text-muted': string; '--accent': string; '--accent-hover': string;
  '--swatch': string;   // signature color shown on the swatch button
}
export interface ThemeVariant { canvas: CanvasColors; css: CssVars; }
export interface Theme { id: ThemeId; label: string; dark: ThemeVariant; light: ThemeVariant; }
export const THEMES: Record<ThemeId, Theme> = { classic, ocean, sunset, forest, minimal };
export const DEFAULT_THEME_ID: ThemeId = 'classic';
export const DEFAULT_MODE: ColorMode = 'dark';
export function getThemeVariant(id: ThemeId, mode: ColorMode): ThemeVariant { return THEMES[id][mode]; }
```

**All 10 palettes (canvas + CSS vars):**

| Theme/Mode | snakeHead | snakeBody | food | wall | canvasBg | --bg | --surface | --accent |
|---|---|---|---|---|---|---|---|---|
| classic dark | `#00ff88` | `#00cc66` | `#e63030` | `#888888` | `#000000` | `#111111` | `#1e1e1e` | `#00ff88` |
| classic light | `#007744` | `#009955` | `#cc2222` | `#666666` | `#e8ffe8` | `#f0fff4` | `#ffffff` | `#007744` |
| ocean dark | `#00e5ff` | `#0099bb` | `#ff6b35` | `#3a5a7a` | `#050d1a` | `#07111f` | `#0d1f33` | `#00e5ff` |
| ocean light | `#006688` | `#0088aa` | `#e05a20` | `#7799bb` | `#e8f4ff` | `#edf6ff` | `#ffffff` | `#006688` |
| sunset dark | `#ff7733` | `#cc5500` | `#ffdd00` | `#7a4422` | `#1a0a00` | `#1e0d00` | `#2d1500` | `#ff7733` |
| sunset light | `#cc4400` | `#e05500` | `#cc9900` | `#bb8866` | `#fff4ee` | `#fff6f0` | `#ffffff` | `#cc4400` |
| forest dark | `#88cc44` | `#558822` | `#ff4422` | `#4a5a2a` | `#0a1200` | `#0d1600` | `#182200` | `#88cc44` |
| forest light | `#337700` | `#448800` | `#cc3311` | `#8a9a66` | `#f0f5e8` | `#f2f6eb` | `#ffffff` | `#337700` |
| minimal dark | `#e0e0e0` | `#999999` | `#e85555` | `#555555` | `#0a0a0a` | `#111111` | `#1c1c1c` | `#e0e0e0` |
| minimal light | `#222222` | `#555555` | `#cc2222` | `#bbbbbb` | `#f5f5f5` | `#f7f7f7` | `#ffffff` | `#222222` |

Apple stem: `#7a4000` / `#5a2a00` (dark/light), leaf: `#3aaa3a` / `#228822` — constant across all themes (secondary detail).  
CSS `--border`, `--text`, `--text-muted`, `--accent-hover`, `--surface2` follow the same color families per theme.

---

### Task 2 — Extend `src/renderer.ts`

Add `foodStem` and `foodLeaf` to `RendererConfig['colors']` interface (lines 5–13):
```ts
foodStem: string;
foodLeaf: string;
```

Add defaults to `DEFAULT_CONFIG.colors` (after `wall` field):
```ts
foodStem: '#7a4000',
foodLeaf: '#3aaa3a',
```

Update `drawApple` signature (line 88):
```ts
function drawApple(ctx, food, cellSize, colors: RendererConfig['colors']): void
```
Replace hardcoded `'#e63030'` → `colors.food`, `'#7a4000'` → `colors.foodStem`, `'#3aaa3a'` → `colors.foodLeaf`.

Update call site in `render()` (line 244):
```ts
drawApple(ctx, state.food, cellSize, colors);
```

---

### Task 3 — Create `src/style.css`

**Structure:**
1. `:root` — font variables (`--font-ui: system-ui, sans-serif; --font-mono: monospace`) + classic-dark defaults for all `--*` vars
2. Per-theme-per-mode overrides: `[data-theme="X"][data-mode="Y"]` blocks (10 total), each setting the 8 `--*` vars
3. Base reset and `body` — flex column, centered, `background: var(--bg)`, `color: var(--text)`, `font-family: var(--font-ui)`, `transition: background 150ms ease, color 150ms ease`, `gap: 10px`, `padding: 16px 12px`
4. `#page-header` — flex row, space-between, align-items center, `max-width: 640px`, `width: 100%`
5. `#page-title` — `color: var(--accent)`, `font-family: var(--font-ui)`, `font-weight: 700`, `font-size: 18px`, `letter-spacing: 3px`, uppercase
6. `#theme-controls` — flex row, `gap: 10px`, align-items center
7. `#theme-swatches` — flex row, `gap: 6px`, list-style none, margin/padding 0
8. `.theme-swatch` — 22px circle buttons, `background: var(--swatch-color)` (inline custom prop), `border: 2px solid transparent`, `cursor: pointer`; `.theme-swatch.active` → `border-color: var(--text)`, `outline: 2px solid var(--text)`, `outline-offset: 2px`
9. `#mode-toggle` — 32px circle button, `background: var(--surface)`, `border: 1px solid var(--border)`, `color: var(--text)`, hover border `var(--accent)`, `font-size: 16px`, cursor pointer
10. `#game-intro` — `font-size: 12px`, `color: var(--text-muted)`, `max-width: 420px`, `text-align: center`, `line-height: 1.6`
11. `#stats` — flex row, `gap: 12px`
12. `.stat` — `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 8px`, `padding: 6px 18px`, `font-size: 11px`, `color: var(--text-muted)`, uppercase, `letter-spacing: 1px`, flex column, align center
13. `.stat-value` — `font-size: 20px`, `color: var(--accent)`, `font-weight: 600`
14. `#hud select` — `background: var(--surface)`, `color: var(--text)`, `border: 1px solid var(--border)`, `border-radius: 6px`, `padding: 4px 10px`, `font-family: var(--font-ui)`, focus `border-color: var(--accent)`
15. `#name-entry` — `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 10px`, `padding: 12px 20px`, `color: var(--text-muted)`, `font-size: 13px`, text-align center
16. `#name-input` — `background: var(--surface2)`, `color: var(--text)`, `border: 1px solid var(--border)`, `border-radius: 6px`, focus `border-color: var(--accent)`
17. `#name-submit` hover → `background: var(--accent)`, `color: var(--bg)`, `border-color: var(--accent)`
18. `#scoreboard` — `max-width: 420px`, `width: 100%`, text-align center
19. `#score-table` — `font-family: var(--font-mono)`, `font-size: 12px`, `border-collapse: collapse`, cells `border-bottom: 1px solid var(--border)`
20. `#score-table th` — `color: var(--text-muted)`

---

### Task 4 — Rewrite `index.html`

Remove the entire `<style>` block. Add `data-theme="classic"` and `data-mode="dark"` on `<html>`.

New header structure (replaces bare `<h1>`):
```html
<header id="page-header">
  <h1 id="page-title">Play Snake</h1>
  <div id="theme-controls">
    <ul id="theme-swatches">
      <li><button class="theme-swatch active" data-theme-id="classic" aria-label="Classic" style="--swatch-color:#00ff88"></button></li>
      <li><button class="theme-swatch" data-theme-id="ocean"   aria-label="Ocean"   style="--swatch-color:#00e5ff"></button></li>
      <li><button class="theme-swatch" data-theme-id="sunset"  aria-label="Sunset"  style="--swatch-color:#ff7733"></button></li>
      <li><button class="theme-swatch" data-theme-id="forest"  aria-label="Forest"  style="--swatch-color:#88cc44"></button></li>
      <li><button class="theme-swatch" data-theme-id="minimal" aria-label="Minimal" style="--swatch-color:#aaaaaa"></button></li>
    </ul>
    <button id="mode-toggle" aria-label="Toggle light/dark mode">🌙</button>
  </div>
</header>
```

All existing IDs and `data-testid` attributes are **preserved unchanged**. No other structural changes.

---

### Task 5 — Update `src/main.ts`

**Add at top** (after existing imports):
```ts
import './style.css';
import { THEMES, DEFAULT_THEME_ID, DEFAULT_MODE, getThemeVariant, type ThemeId, type ColorMode } from './themes';
```

**New state variables** (after DOM queries):
```ts
const LS_THEME = 'snake-theme';
const LS_MODE  = 'snake-mode';
let currentThemeId: ThemeId = (localStorage.getItem(LS_THEME) as ThemeId) ?? DEFAULT_THEME_ID;
let currentMode: ColorMode  = (localStorage.getItem(LS_MODE) as ColorMode) ?? DEFAULT_MODE;
let rendererConfig: RendererConfig = DEFAULT_CONFIG;
```

**New DOM refs**:
```ts
const htmlEl     = document.documentElement;
const modeToggle = document.getElementById('mode-toggle') as HTMLButtonElement;
const swatches   = document.querySelectorAll<HTMLButtonElement>('.theme-swatch');
```

**`applyTheme()` function**:
```ts
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
```

**Event listeners** (after existing ones):
```ts
modeToggle.addEventListener('click', () => {
  currentMode = currentMode === 'dark' ? 'light' : 'dark';
  applyTheme();
});
swatches.forEach(btn => btn.addEventListener('click', () => {
  currentThemeId = btn.dataset['themeId'] as ThemeId;
  applyTheme();
}));
```

**Fix `applySize`** — replace `DEFAULT_CONFIG.cellSize` with the constant `20` (cell size never changes).

**Fix render call** — replace `DEFAULT_CONFIG` with `rendererConfig`.

**Init order**:
```ts
applyTheme();   // must run before applySize so rendererConfig is set
applySize(sizeId);
renderScoreboard();
requestAnimationFrame(loop);
```

---

## Acceptance Criteria

- Clicking any swatch immediately changes both page colors and canvas rendering colors
- The active swatch shows a visible selection ring
- The 🌙/☀️ button toggles dark/light mode and icon updates accordingly
- All 5 themes × 2 modes render without any hardcoded colors leaking through
- Theme and mode persist across page reloads (localStorage)
- All existing IDs (`score`, `game-canvas`, `difficulty-select`, etc.) and `data-testid` attributes are present and functional
- `npm run build` completes without TypeScript errors
- `npm test` passes (game logic is untouched)
- `npm run test:e2e` passes (no DOM contract changes)

---

## Verification

1. `npm run dev` → open `http://localhost:5173`
2. Click each of 5 swatch buttons — canvas snake/food colors change each time
3. Click mode toggle — page background, surface, and text colors invert; icon changes
4. Refresh page — last selected theme and mode are restored
5. Play a game to game-over — name entry form renders correctly in each theme
6. `npm run build` — no errors
7. `npm test` — all unit tests pass
