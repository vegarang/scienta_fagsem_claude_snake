# Dynamic Wall Spawning for Medium and Hard Difficulty

## Context

The game currently has static walls: medium has none, hard has two fixed vertical walls at hardcoded positions. The request is to:
- **Medium**: start with no walls, spawn small walls over time
- **Hard**: start with scaled initial walls, spawn larger walls over time
- Newly spawned walls must never appear near the snake head or in the direction of travel
- Hard mode initial wall positions must scale with the selected grid size

## Approach

Add `dynamicWalls: readonly ExtraWall[]` to `GameState` to hold walls added during gameplay. Static level walls (`level.extraWalls`) remain for any other use; hard mode's initial walls move into `dynamicWalls` generated at `createGame()` time (scaled to `gridSize`). The `tick()` function checks the score after eating and calls a new `spawnWall()` helper when the score crosses a threshold. Wall placement rejects any candidate that has a cell within a safety radius of the head or inside a look-ahead corridor in the current direction of travel.

This keeps `tick()` a pure function by passing `rng` (already the pattern for food), threads the new field through all collision/food-placement call sites, and introduces no new rendering or input machinery.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types.ts` | **Modify** | Add `dynamicWalls` to `GameState`; add `wallSpawnScore`, `wallSpawnInterval`, `wallSpawnMaxLength` to `LevelConfig` |
| `src/levels.ts` | **Modify** | Add spawn config to each level; clear `extraWalls` for hard (walls now generated at runtime) |
| `src/game.ts` | **Modify** | `createGame` generates scaled initial walls for hard; `tick` uses combined walls and spawns a wall when conditions are met |
| `src/walls.ts` | **Create** | `spawnWall()`, `generateInitialWalls()`, safety helpers |
| `src/renderer.ts` | **Modify** | Pass combined walls (`[...state.level.extraWalls, ...state.dynamicWalls]`) to `drawWalls` |

## Implementation Steps

### Task 1 — Extend types (`src/types.ts`)

Add three fields to `LevelConfig` (lines 17–25):
```ts
readonly wallSpawnScore: number;     // score at which first wall spawns
readonly wallSpawnInterval: number;  // 0 = never; N = every N food after wallSpawnScore
readonly wallSpawnMaxLength: number; // max cells for a spawned wall
```

Add one field to `GameState` (lines 27–37):
```ts
readonly dynamicWalls: readonly ExtraWall[];
```

### Task 2 — Update level configs (`src/levels.ts`)

- **Easy**: `wallSpawnScore: 0, wallSpawnInterval: 0, wallSpawnMaxLength: 0`
- **Medium**: `wallSpawnScore: 5, wallSpawnInterval: 5, wallSpawnMaxLength: 3`
- **Hard**: `wallSpawnScore: 8, wallSpawnInterval: 6, wallSpawnMaxLength: 4`; change `extraWalls` to `[]` (initial walls moved to `generateInitialWalls`)

### Task 3 — Create `src/walls.ts`

**`generateInitialWalls(level, gridSize)`** — returns scaled hard walls:
- Only activates for `level.id === 'hard'`
- Positions: x at `Math.floor(gridSize.x * 0.25)` and `Math.floor(gridSize.x * 0.70)`
- y range: `Math.floor(gridSize.y * 0.25)` to `Math.floor(gridSize.y * 0.70)`
- Returns `[{from:{x:x1,y:y1},to:{x:x1,y:y2}}, {from:{x:x2,y:y1},to:{x:x2,y:y2}}]`
- For the 20×20 small grid this reproduces the current `{x:5,y:5}→{x:5,y:14}` and `{x:14,y:5}→{x:14,y:14}` exactly

**Safety helpers (internal)**:
- `isTooCloseToHead(pos, head, safeRadius=5)` — Chebyshev distance `< safeRadius`
- `isInLookAheadZone(pos, head, direction, lookAhead=8)` — for horizontal travel: `abs(pos.y-head.y) <= 1 && pos.x in [head.x, head.x±lookAhead]`; vertical: mirror on y axis

**`spawnWall(state, rng)`** — up to 100 attempts:
1. Pick random orientation (H/V), length `[1, level.wallSpawnMaxLength]`, position within grid
2. Compute `allWalls = [...level.extraWalls, ...dynamicWalls]`
3. For each cell in candidate wall, reject if:
   - `hitsExtraWall(cell, allWalls)` — overlaps existing wall
   - `snake.some(s => samePos(s, cell))` — overlaps snake body
   - `isTooCloseToHead(cell, head, 5)` — within safety radius
   - `isInLookAheadZone(cell, head, direction, 8)` — in travel corridor
   - `samePos(cell, food)` — overlaps food
4. Return first valid candidate, or `null` if all attempts fail (grid too full → skip silently)

### Task 4 — Update `src/game.ts`

**`createGame`** (line 22):
```ts
import { generateInitialWalls, spawnWall } from './walls';

export function createGame(level, gridSize): GameState {
  const snake = initialSnake(gridSize);
  const dynamicWalls = generateInitialWalls(level, gridSize);
  const allWalls = [...level.extraWalls, ...dynamicWalls];
  const food = placeFood(snake, allWalls, gridSize);
  return { ..., dynamicWalls, food };
}
```

**`tick`** (line 49) — three changes:

1. Collision check (line 58) — use combined walls:
```ts
const allWalls = [...level.extraWalls, ...state.dynamicWalls];
if (newHead === null || hitsExtraWall(newHead, allWalls)) { ... }
```

2. Food placement (line 73) — use combined walls:
```ts
const newFood = ate ? placeFood(newSnake, allWalls, gridSize, rng) : state.food;
```

3. Wall spawning — after computing `newScore`:
```ts
let newDynamicWalls = state.dynamicWalls;
if (ate && level.wallSpawnInterval > 0 && newScore >= level.wallSpawnScore) {
  if ((newScore - level.wallSpawnScore) % level.wallSpawnInterval === 0) {
    const partialState = { ...state, snake: newSnake, score: newScore };
    const wall = spawnWall(partialState, rng);
    if (wall) newDynamicWalls = [...state.dynamicWalls, wall];
  }
}
```

Return `newDynamicWalls` in the new state.

### Task 5 — Update `src/renderer.ts`

Change the `drawWalls` call (line 246) to pass combined walls:
```ts
drawWalls(ctx, [...state.level.extraWalls, ...state.dynamicWalls], cellSize, colors.wall);
```

## Acceptance Criteria

- Easy: no walls appear at any score
- Medium: first wall appears when score reaches 5, another at 10, 15, … each wall is 1–3 cells long (H or V)
- Hard (20×20 small grid): opens with two vertical walls at x=5 and x=14, y=5–14 (identical to current hardcoded layout)
- Hard (39×22 medium grid): opens with walls at x≈9 and x≈27, y≈5–15 (proportional)
- Hard (53×30 large grid): opens with walls at x≈13 and x≈37, y≈7–21 (proportional)
- No spawned wall cell is within 5 cells (Chebyshev) of the snake head at spawn time
- No spawned wall cell is in the 8-cell corridor ahead of the snake head in the current direction of travel
- If `spawnWall` cannot find a safe placement in 100 attempts, the game continues without adding a wall (no crash)
- Existing wall collision detection and food avoidance work correctly for dynamically added walls
- `npm test` passes (unit tests for `generateInitialWalls` and `spawnWall` added in `src/walls.test.ts`)

## Verification Steps

1. `npm test` — all existing + new unit tests green
2. Start dev server (`npm run dev`) and play medium: confirm walls appear gradually
3. Play hard on small/medium/large grids: confirm initial walls are proportional to grid size
4. Verify no wall spawns directly ahead of the snake head (manual: steer snake at one edge and watch spawns)
5. `npm run build` — TypeScript type-check passes

## Risks & Mitigations

- **`spawnWall` called with stale direction**: direction is updated earlier in `tick` before the wall check, so `state.direction` reflects the current move — pass `partialState` with updated `snake` but existing `direction` is correct.
- **Very small or crowded grid**: `spawnWall` returns `null` after 100 attempts; game continues unchanged. Low risk for standard grid sizes.
- **Hard initial walls overlap snake spawn**: snake starts at grid center; walls are placed at ~25%/70% of each axis, well away from center — no overlap.
