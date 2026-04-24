# Plan: Improve Snake Game to 10/10

## Context

The project rated 8.5/10. Five concrete issues prevented a perfect score:
1. `main.ts:143-144` hardcodes cell pixel size as `20` while `DEFAULT_CONFIG.cellSize = 20` is already imported — a latent bug if cell size ever changes.
2. `game.ts tick()` (lines 74–163, 89 lines) mixes effect aging, collision resolution, spawn logic, and state assembly in one function.
3. `renderer.ts drawSnake()` (lines 219–314, 96 lines) mixes body segment drawing, head drawing, eye geometry, and tongue geometry.
4. Powerup spawn parameters (`POWERUP_SPAWN_MIN/MAX`, `POWERUP_MAX_ON_BOARD`) are module-level constants, not tunable per level.
5. The powerup legend is collapsed by default, so first-time players don't know what powerups do until after collecting them.

---

## File Changes

| File | Action | What changes |
|------|--------|-------------|
| `src/main.ts` | **Modify** | Lines 143–144: replace literal `20` with `DEFAULT_CONFIG.cellSize` (already imported on line 191, hoist the constant) |
| `src/game.ts` | **Modify** | Extract `ageEffectsAndPowerups()`, `resolveCollisions()`, and `maybeSpawnPickups()` from `tick()`; `tick()` becomes a thin orchestrator |
| `src/renderer.ts` | **Modify** | Extract `drawBodySegment()`, `drawSnakeHead()`, `drawEyes()`, `drawTongue()` from `drawSnake()`; `drawSnake()` becomes a thin orchestrator |
| `src/types.ts` | **Modify** | Add three optional fields to `LevelConfig`: `powerupMaxOnBoard?`, `powerupSpawnMin?`, `powerupSpawnMax?` |
| `src/game.ts` | **Modify** | Use `state.level.powerupMaxOnBoard ?? POWERUP_MAX_ON_BOARD` (and same for spawn min/max) when checking powerup spawn logic |
| `index.html` | **Modify** | Change the powerup legend `<details>` element to include the `open` attribute so it is expanded by default |

---

## Implementation Steps

### Task 1 — Fix magic cell-size number (main.ts)

**`src/main.ts:143-144`** — hoist the `cellSize` constant to before `fitCanvas()` (currently defined at line 191), then replace:
```ts
// before
canvas.width  = cfg.grid.x * 20;
canvas.height = cfg.grid.y * 20;

// after
canvas.width  = cfg.grid.x * cellSize;
canvas.height = cfg.grid.y * cellSize;
```
No logic change — this is a correctness improvement.

---

### Task 2 — Decompose `tick()` in game.ts

Extract three private helpers, keeping `tick()` as an orchestrator (~25 lines):

**`ageEffectsAndPowerups(state: GameState): Pick<GameState, 'activeEffects' | 'powerUpsOnBoard'>`**
- Contains current lines 84–91: age `activeEffects` (decrement `ticksLeft`), filter expired; age `powerUpsOnBoard` (decrement `ticksLeft`), filter expired.

**`resolveCollisions(state: GameState, nextHead: Vec2): { ate: boolean; powerUpEaten: PowerUp | null; died: boolean }`**
- Contains current lines 94–121: ghost mode self-collision check, food equality check, powerup position check.
- Returns a plain object so `tick()` can branch on the results.

**`maybeSpawnPickups(state: GameState): Pick<GameState, 'extraWalls' | 'powerUpsOnBoard' | 'powerupSpawnIn'>`**
- Contains current lines 132–146: wall spawn check (score threshold + interval), powerup spawn countdown.
- Returns only the fields it may mutate.

`tick()` calls these three helpers and assembles the final state in order — pure orchestration, no inline logic.

---

### Task 3 — Decompose `drawSnake()` in renderer.ts

Extract four private helpers:

**`drawBodySegment(ctx, seg: Vec2, isGhost: boolean, CS: number, theme: Theme): void`**  
Lines 231–246 — ghost strip pattern or normal rounded rect.

**`drawEyes(ctx, hx: number, hy: number, dir: Direction, CS: number, theme: Theme): void`**  
Lines 281–297 — eye white, pupil offset by direction.

**`drawTongue(ctx, hx: number, hy: number, dir: Direction, CS: number, theme: Theme): void`**  
Lines 299–312 — forked tongue shape.

**`drawSnakeHead(ctx, head: Vec2, dir: Direction, CS: number, theme: Theme, isGhost: boolean): void`**  
Lines 258–313 — head rect, neck strip, calls `drawEyes()` and `drawTongue()`.

`drawSnake()` loops body segments calling `drawBodySegment()`, then calls `drawSnakeHead()`. Under 20 lines.

---

### Task 4 — Per-level powerup config (types.ts + game.ts)

**`src/types.ts`** — add to `LevelConfig`:
```ts
readonly powerupMaxOnBoard?: number;
readonly powerupSpawnMin?: number;
readonly powerupSpawnMax?: number;
```

**`src/game.ts`** — in `maybeSpawnPickups()`, replace direct constant references:
```ts
// before
if (state.powerUpsOnBoard.length < POWERUP_MAX_ON_BOARD && ...)
// after
const maxOnBoard = state.level.powerupMaxOnBoard ?? POWERUP_MAX_ON_BOARD;
if (state.level.powerupMaxOnBoard != null) { ... }
```
No changes to `levels.ts` required (all fields are optional with sane global defaults).

---

### Task 5 — Powerup legend expanded by default (index.html)

Find the `<details>` element wrapping the powerup legend and add `open`:
```html
<!-- before -->
<details>
<!-- after -->
<details open>
```
One character change, zero logic impact.

---

## Acceptance Criteria

- `main.ts` contains no literal `20` in canvas sizing lines (uses `cellSize` constant).
- `tick()` in `game.ts` is ≤30 lines; contains no inline aging, collision, or spawn logic — only calls to the three helpers.
- `drawSnake()` in `renderer.ts` is ≤20 lines; calls `drawBodySegment()` and `drawSnakeHead()`.
- `drawSnakeHead()` calls `drawEyes()` and `drawTongue()`.
- `LevelConfig` has three optional powerup fields; `game.ts` uses `?? POWERUP_MAX_ON_BOARD` fallback pattern.
- Powerup legend is visible (expanded) when the page first loads.
- All 140 existing tests still pass (`npm test`).
- `npm run build` exits 0 (no TypeScript errors).
- `npm run lint` exits 0 (no ESLint violations).

---

## Verification Steps

1. `npm test` — all 140 tests pass, coverage thresholds met.
2. `npm run build` — clean compile, no type errors.
3. `npm run lint` — no violations.
4. `npm run dev` → open browser → verify legend is expanded on load.
5. Change grid size in levels.ts temporarily and verify canvas resizes correctly (tests the magic-number fix).
6. `npm run test:e2e` — Playwright smoke tests pass.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Hoisting `cellSize` in main.ts breaks initialization order | Read main.ts carefully before editing — `DEFAULT_CONFIG` is imported at module level so `cellSize` can be a module-level const |
| Extracting helpers from `tick()` breaks existing unit tests | Helpers are private (not exported); existing tests call `tick()` and still pass without changes |
| `drawSnake()` sub-functions need the same `theme`/`CS` params threaded through | All four helpers take `(ctx, ..., CS, theme)` — consistent signature pattern |
| Optional LevelConfig fields need default fallbacks in all call sites | Only one call site in `game.ts`; `??` operator handles it cleanly |
