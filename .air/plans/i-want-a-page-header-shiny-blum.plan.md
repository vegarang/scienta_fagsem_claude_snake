# Plan: Page Header, Ingress, and Stats Panel

## Context
The Snake game currently has a minimal HUD (score + difficulty/size buttons in one row above the canvas, no page title or description). The user wants a polished page layout with a title, game description, and a pretty score/difficulty display that sits between the description and the selector buttons.

## Target Layout (top → bottom)
1. `<h1>` — "Play Snake"
2. `<p id="game-intro">` — brief description + controls hint
3. `<div id="stats">` — score chip + difficulty chip (pretty display)
4. `<canvas>` — game area (unchanged)
5. `<div id="hud">` — difficulty + size selectors only (score removed from here)
6. Name entry (unchanged)
7. Scoreboard (unchanged)

---

## File Changes

### `index.html` — Modify

**CSS additions** (inside `<style>`):
- `body`: change `height: 100vh` → `min-height: 100vh` + `padding: 12px 0` + `overflow-y: auto` so added elements don't clip on small screens
- `#page-title`: `font-size: 20px; letter-spacing: 3px; text-transform: uppercase; color: #4caf50; margin: 0;`
- `#game-intro`: `font-size: 12px; color: #666; text-align: center; margin: 0; max-width: 420px; line-height: 1.6;`
- `#stats`: `display: flex; gap: 12px;`
- `.stat`: `background: #222; border: 1px solid #333; border-radius: 6px; padding: 6px 16px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; display: flex; flex-direction: column; align-items: center; gap: 2px;`
- `.stat-value`: `font-size: 18px; color: #4caf50; letter-spacing: 0; text-transform: none;`

**HTML changes** (inside `<body>`):
- Add before the current `<div id="hud">`:
  ```html
  <h1 id="page-title">Play Snake</h1>
  <p id="game-intro">
    Guide the snake to eat food, grow longer, and rack up points.<br>
    Arrow keys or WASD to steer &middot; Space to start, pause, or restart
  </p>
  <div id="stats">
    <div class="stat">Score<span class="stat-value" id="score" data-testid="score">0</span></div>
    <div class="stat">Difficulty<span class="stat-value" id="stat-difficulty">Easy</span></div>
  </div>
  ```
- In `<div id="hud">`: remove the `<span>Score: <span id="score" ...>0</span></span>` element — score now lives in `#stats`
- Reorder so `<canvas>` comes after `#stats` and `<div id="hud">` (selectors) comes after the canvas

### `src/main.ts` — Modify

1. Add element reference:
   ```ts
   const statDifficultyEl = document.getElementById('stat-difficulty')!;
   ```
2. Update `setActiveButton()` to also set the difficulty chip text:
   ```ts
   function setActiveButton(id: string): void {
     difficultyButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.level === id));
     statDifficultyEl.textContent = getLevel(id).name;
   }
   ```
   (`getLevel` is already imported from `./levels` and `.name` exists on the level config)
3. No other changes — `scoreEl.textContent` on line 114 already handles live score updates.

---

## Acceptance Criteria
- "PLAY SNAKE" heading is visible at the top in green
- A short 2-line description with controls hint is shown below the heading
- Two styled chips show the live score and current difficulty name
- Difficulty chip updates when a difficulty button is clicked
- Selector buttons (difficulty + size) appear below the canvas
- `data-testid="score"` is preserved on `#score` (required by e2e tests)
- Layout does not overflow/clip on a 1080p screen with "small" canvas selected

## Verification
1. `npm run dev` → check visual layout in browser
2. Play a game — score chip increments
3. Click a different difficulty — difficulty chip updates to match
4. `npm test` — unit tests pass
5. `npm run test:e2e` — Playwright tests pass (score testid preserved)