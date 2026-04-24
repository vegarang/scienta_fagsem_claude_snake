# Context

The canvas currently draws a score label (top-left) and level name (top-right) as text overlaid on the game grid. These can obscure apples and powerups that spawn near the edges. The pause button is an absolutely-positioned HTML button overlaid on the top-right of the canvas, also potentially hiding game objects. The fix is to strip those text draws from the canvas and relocate the pause button to the existing `#stats` bar above the canvas — all game data stays visible in the UI, just no longer on top of gameplay.

## Approach

- **Remove canvas text rendering** for score and level name in `src/renderer.ts` (score is already shown in the HTML stats bar; level name is already shown via the `#stat-difficulty` span).  
- **Move the pause button** from inside `#canvas-wrapper` to the end of `#stats` in `index.html`. Since JS references it by ID (`pause-btn`), no JS changes are needed.  
- **Restyle the pause button** from `position: absolute` overlay to a flex item in the stats row, pushed right with `margin-left: auto`, using CSS variables to match the rest of the UI.

---

## File Changes

### `src/renderer.ts` — Modify

Lines 371–375: Delete the entire block that draws score and level name text:

```ts
// DELETE these 5 lines:
ctx.fillStyle = colors.text;
ctx.textAlign = 'left';
ctx.font = '14px monospace';
ctx.fillText(`Score: ${state.score}`, 6, 16);
ctx.fillText(state.level.name, canvas.width - 60, 16);
```

No other canvas rendering changes needed — score/difficulty are already in the HTML stats bar.

---

### `index.html` — Modify

**Move** the pause button out of `#canvas-wrapper` and into `#stats` (as the last child):

Before:
```html
<div id="stats">
  <div class="stat">Score...</div>
  <div class="stat">Difficulty...</div>
</div>
<div id="canvas-wrapper">
  <canvas id="game-canvas" ...></canvas>
  <button id="pause-btn" aria-label="Pause" hidden>⏸</button>
</div>
```

After:
```html
<div id="stats">
  <div class="stat">Score...</div>
  <div class="stat">Difficulty...</div>
  <button id="pause-btn" aria-label="Pause" hidden>⏸</button>
</div>
<div id="canvas-wrapper">
  <canvas id="game-canvas" ...></canvas>
</div>
```

---

### `src/style.css` — Modify

Replace the `#pause-btn` and `#pause-btn:hover` blocks (currently `position: absolute` overlay) with flex-item styling:

```css
#pause-btn {
  margin-left: auto;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 100ms ease, border-color 100ms ease;
  flex-shrink: 0;
}

#pause-btn:hover {
  border-color: var(--accent);
}
```

(Verify exact CSS variable names — `--text`, `--surface`, `--border`, `--accent` — against the top-of-file definitions in `style.css` before writing.)

---

## Implementation Steps

1. **renderer.ts** — Delete the 5-line block (lines 371–375) that draws score + level name.
2. **index.html** — Move `<button id="pause-btn" …>` from inside `#canvas-wrapper` to the end of `#stats`.
3. **style.css** — Replace `#pause-btn` / `#pause-btn:hover` with the new flex-item styles above.

---

## Acceptance Criteria

- Score text no longer drawn on canvas during gameplay.
- Level name no longer drawn on canvas during gameplay.
- Pause button appears in the stats bar above the canvas (not overlaying the canvas) when a game is active.
- Pause button is hidden before a game starts (same `hidden` attribute behavior as before).
- Pause button icon toggles ⏸ / ▶ on pause/resume — JS wiring unchanged.
- Stats row (Score · Difficulty · Pause button) lays out in one horizontal row without overflow.
- No UI elements overlap the canvas game grid.

## Verification Steps

1. `npm run dev` → start game → confirm no score/level text drawn on canvas.
2. Confirm pause button appears in stats bar, not on canvas.
3. Click pause → game pauses, icon → ▶. Click again → resumes, icon → ⏸.
4. `npm test` — unit tests pass.
5. `npm run test:e2e` — Playwright tests pass (`data-testid="score"` element is unchanged).

## Risks & Mitigations

- **CSS variable mismatch**: `--text` may not be defined. Read CSS vars at top of `style.css` and use exact names. Fall back to a safe literal if a variable is missing.
- **Button height alignment**: The `.stat` boxes use `padding: 6px 18px` — visually verify the button aligns at the same height in the browser and adjust `height` if needed.
