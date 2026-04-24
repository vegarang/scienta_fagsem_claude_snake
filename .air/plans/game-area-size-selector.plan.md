# Game Area Size Selector

## Context

The game currently has a fixed 400×400 canvas (20×20 grid, 20px cells). The user wants a size selector with three options — small (current), medium (10% taller, 16:9), and large (50% taller, 16:9) — plus automatic CSS scaling when the canvas is too large for the viewport.

---

## Approach

Add a `src/sizes.ts` module (matching the pattern of `src/levels.ts`) that defines three size configs with grid dimensions derived from the pixel requirements. Wire a `#size` button group in the HUD (matching the style and wiring of `#difficulty`). In `main.ts`, replace the static `GRID` constant with a dynamic size, resize the canvas element on size change, and add a `fitCanvas()` helper that sets `canvas.style.width/height` to scale the logical canvas resolution down to fit the viewport (CSS scaling preserves canvas resolution).

---

## Sizes

| Size   | Height | Width (16:9 rounded to cell) | Grid (cols × rows) | Canvas px   |
|--------|--------|-----------------------------|--------------------|-------------|
| Small  | 400 px | 400 px (square, as-is)      | 20 × 20            | 400 × 400   |
| Medium | 440 px | 780 px (39 × 20)            | 39 × 22            | 780 × 440   |
| Large  | 600 px | 1060 px (53 × 20)           | 53 × 30            | 1060 × 600  |

Cell size stays at 20 px for all three; only the grid cell count changes.

---

## File Changes

### 1. `src/sizes.ts` — **Create**
New module mirroring `src/levels.ts` pattern:
```typescript
export interface SizeConfig {
  readonly id: string;
  readonly name: string;
  readonly grid: { readonly x: number; readonly y: number };
}

export const SIZES: Record<string, SizeConfig> = {
  small:  { id: 'small',  name: 'Small',  grid: { x: 20, y: 20 } },
  medium: { id: 'medium', name: 'Medium', grid: { x: 39, y: 22 } },
  large:  { id: 'large',  name: 'Large',  grid: { x: 53, y: 30 } },
};

export function getSize(id: string): SizeConfig {
  return SIZES[id] ?? SIZES.small;
}
```

### 2. `index.html` — **Modify**
- Add `#size` button group inside `#hud` (after `#difficulty`):
  ```html
  <div id="size">
    <button data-size="small" class="active">Small</button>
    <button data-size="medium">Medium</button>
    <button data-size="large">Large</button>
  </div>
  ```
- Add CSS for `#size` and `#size button` (identical styling to `#difficulty` / `#difficulty button`)
- Remove `width="400" height="400"` from `<canvas>` (set dynamically in JS)

### 3. `src/main.ts` — **Modify**
- Import `getSize` from `./sizes`
- Read `?size=` URL param (default `'small'`)
- Replace `const GRID = { x: 20, y: 20 }` with `let grid = getSize(sizeId).grid`
- Add `fitCanvas()` helper:
  ```typescript
  function fitCanvas(): void {
    const scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height, 1);
    canvas.style.width  = `${Math.round(canvas.width  * scale)}px`;
    canvas.style.height = `${Math.round(canvas.height * scale)}px`;
  }
  ```
- Add `applySize(id)` that sets `canvas.width`, `canvas.height`, calls `fitCanvas()`, resets game:
  ```typescript
  function applySize(id: string): void {
    const cfg = getSize(id);
    grid = cfg.grid;
    canvas.width  = cfg.grid.x * DEFAULT_CONFIG.cellSize;
    canvas.height = cfg.grid.y * DEFAULT_CONFIG.cellSize;
    fitCanvas();
    state = createGame(getLevel(levelId), grid);
  }
  ```
- Wire `#size button` clicks (same pattern as `#difficulty`)
- Call `applySize(sizeId)` on startup instead of hardcoding `GRID`
- Add `window.addEventListener('resize', fitCanvas)`
- Update all `createGame(getLevel(levelId), GRID)` calls to use `grid` variable

---

## Implementation Steps

**Task 1 — Size config module**
1. Create `src/sizes.ts` with `SizeConfig`, `SIZES`, `getSize` as shown above.

**Task 2 — HTML: size selector + CSS**
2. In `index.html`: add `#size` div with three `data-size` buttons inside `#hud` (after `#difficulty`).
3. Add CSS rules for `#size`, `#size button`, `#size button:hover`, `#size button.active` — copy the four `#difficulty` CSS blocks, replace `difficulty` with `size`.
4. Remove `width="400" height="400"` from `<canvas>`.

**Task 3 — main.ts wiring**
5. Import `getSize` from `./sizes`.
6. Add `let sizeId = new URLSearchParams(location.search).get('size') ?? 'small';`
7. Add `const sizeButtons = document.querySelectorAll<HTMLButtonElement>('#size button');`
8. Replace `const GRID = { x: 20, y: 20 };` with `let grid = getSize(sizeId).grid;`
9. Add `fitCanvas()` and `applySize()` functions (see above).
10. Add size button click handler (sets `sizeId`, marks active, calls `applySize`).
11. Add `setActiveSizeButton` helper similar to `setActiveButton`.
12. Replace startup initialization: call `applySize(sizeId)` (sets canvas dimensions + creates game).
13. Update spacebar handler's `createGame` call to use `grid`.
14. Add `window.addEventListener('resize', fitCanvas)`.

---

## Acceptance Criteria

- Small button selected: canvas is 400×400px, grid 20×20.
- Medium button selected: canvas logical size is 780×440px; visual aspect ratio ≈ 16:9.
- Large button selected: canvas logical size is 1060×600px; visual aspect ratio ≈ 16:9.
- On a viewport narrower than 780px with Medium selected, the canvas CSS width is ≤ viewport width (no horizontal scroll).
- On viewport resize, the canvas re-fits without a page reload.
- Changing size resets the game to idle.
- Changing difficulty after changing size keeps the current size active.
- URL param `?size=large` pre-selects Large on load.
- `npm test` passes (unit tests don't touch main.ts / canvas).
- `npm run build` produces no TypeScript errors.

---

## Verification Steps

1. `npm run dev` → open http://localhost:5173
2. Click each size button; verify canvas resizes visually and game restarts.
3. Open DevTools → inspect canvas `width`/`height` attributes vs `style.width`/`style.height` for each size.
4. Resize browser window below canvas width; verify canvas scales down without scroll.
5. Combine with difficulty: change to Large + Hard; verify game plays with large grid.
6. Load `?size=large`; verify Large button is active on load.
7. `npm test` — all pass.
8. `npm run build` — zero TypeScript errors.

---

## Risks & Mitigations

- **Extra wall coordinates in hard level may land out-of-bounds on small grid** — Extra walls in `src/levels.ts` are at specific Vec2 coords; Small keeps the current 20×20 grid so they stay valid. Medium/Large grids are bigger, so all existing walls remain in-bounds.
- **fitCanvas scaling on initial load** — `applySize()` is called at startup, which sets canvas dimensions and immediately calls `fitCanvas()` before the first RAF frame, so no flash of wrong-sized canvas.
