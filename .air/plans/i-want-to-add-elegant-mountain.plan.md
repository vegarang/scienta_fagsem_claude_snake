# Add Powerups to Snake Game

## Context
The game currently has only apples as collectibles. Adding powerups increases gameplay variety with five timed effects: speed boost, slow down, score multiplier, shrink, and ghost mode. Powerups appear randomly on a timer, persist on the board briefly if uncollected, and active effects expire after a fixed number of ticks.

## Approach
Extend `GameState` with `powerups` (items on board), `activeEffects` (currently running effects), and `powerupSpawnCountdown` (ticks until next spawn attempt). Keep `tickInterval` as the "earned" base speed and expose `getEffectiveTickInterval(state)` for the game loop to apply speed-modifying effects without mutating game state. The `shrink` effect is applied instantly on collection (no timed effect). All new logic follows the existing immutable pure-function pattern.

---

## File Changes

### 1. `src/types.ts` — **Modify**
Add three new exports, extend `GameState`:
```ts
export type PowerUpType = 'speed_boost' | 'slow_down' | 'score_multiplier' | 'shrink' | 'ghost_mode';

export interface PowerUp {
  readonly type: PowerUpType;
  readonly pos: Vec2;
  readonly expiresInTicks: number;
}

export interface ActiveEffect {
  readonly type: PowerUpType;
  readonly remainingTicks: number;
}
```
Add to `GameState`:
```ts
readonly powerups: readonly PowerUp[];
readonly activeEffects: readonly ActiveEffect[];
readonly powerupSpawnCountdown: number;
```

---

### 2. `src/powerups.ts` — **Create**
New file with placement logic + constants:
- `POWERUP_SPAWN_MIN = 25`, `POWERUP_SPAWN_MAX = 50` (ticks between spawns)
- `POWERUP_BOARD_DURATION = 30` (ticks on board before expiry)
- `EFFECT_DURATION = 15` (ticks an active effect lasts)
- `POWERUP_MAX_ON_BOARD = 1`
- `SHRINK_AMOUNT = 3`
- `POWERUP_TYPES: PowerUpType[]` — all five types for random selection
- `placePowerUp(snake, walls, powerups, food, gridSize, rng)` — same candidates approach as `placeFood` in `src/food.ts`, but also excludes existing powerup positions and the food position

---

### 3. `src/game.ts` — **Modify**

**`createGame`** — initialize new fields:
```ts
powerups: [],
activeEffects: [],
powerupSpawnCountdown: POWERUP_SPAWN_MIN,
```

**Export `getEffectiveTickInterval(state: GameState): number`**:
```ts
if (state.activeEffects.some(e => e.type === 'speed_boost'))
  return Math.max(state.tickInterval * 0.5, 30);
if (state.activeEffects.some(e => e.type === 'slow_down'))
  return state.tickInterval * 1.8;
return state.tickInterval;
```

**`tick` changes** (in order):
1. Age active effects — decrement `remainingTicks`, filter out those reaching 0
2. Age powerups on board — decrement `expiresInTicks`, filter out those reaching 0
3. Ghost mode collision — skip wall/boundary gameover if `ghost_mode` is active
4. Powerup collision — check if `newHead` matches any powerup position via `samePos`:
   - Timed effects push to `activeEffects` with `EFFECT_DURATION`
   - `shrink`: immediately slice tail `newSnake.slice(0, Math.max(1, newSnake.length - SHRINK_AMOUNT))`
5. Score multiplier — when food eaten: `ate ? state.score + (multiplierActive ? 2 : 1) : state.score`
6. Spawn countdown — decrement; when ≤ 0 and below max, spawn a powerup and reset countdown randomly

---

### 4. `src/renderer.ts` — **Modify**

**Add `drawPowerUp(ctx, powerup, cellSize)`**:
| Type | Circle color | Label |
|------|-------------|-------|
| `speed_boost` | `#FFD700` gold | `⚡` |
| `slow_down` | `#00BFFF` cyan | `❄` |
| `score_multiplier` | `#FF69B4` pink | `×2` |
| `shrink` | `#7CFC00` lawn-green | `✂` |
| `ghost_mode` | `#9370DB` medium-purple | `◈` |

**Active effects HUD** — bottom-left of canvas, one colored pill per active effect with a shrinking progress bar proportional to `remainingTicks / EFFECT_DURATION`.

**In `render()`** — after `drawApple`, call `drawPowerUp` for each powerup; then draw HUD.

---

### 5. `src/main.ts` — **Modify**

Import `getEffectiveTickInterval`. Update the loop:
```ts
while (accumulator >= getEffectiveTickInterval(state)) {
  accumulator -= getEffectiveTickInterval(state);
  state = tick(state);
}
```

---

## Implementation Steps

1. Add `PowerUpType`, `PowerUp`, `ActiveEffect` to `src/types.ts`; extend `GameState`
2. Create `src/powerups.ts` with constants and `placePowerUp()`
3. Update `createGame` in `src/game.ts`
4. Add `getEffectiveTickInterval` export to `src/game.ts`
5. Update `tick` in `src/game.ts` (aging, ghost bypass, pickup, multiplier, spawn)
6. Add `drawPowerUp` and HUD to `src/renderer.ts`
7. Call `drawPowerUp` for each powerup in `render()`
8. Update game loop in `src/main.ts`

---

## Acceptance Criteria

1. Powerup appears on board every 25–50 ticks when fewer than `POWERUP_MAX_ON_BOARD` present
2. Uncollected powerup disappears after 30 ticks
3. Collecting a powerup removes it from the board immediately
4. `speed_boost`: snake ticks at `tickInterval × 0.5` (min 30ms) for 15 ticks
5. `slow_down`: snake ticks at `tickInterval × 1.8` for 15 ticks
6. `score_multiplier`: apples award 2 points for 15 ticks
7. `shrink`: snake loses 3 tail segments immediately (min length 1)
8. `ghost_mode`: no gameover from wall/boundary hits for 15 ticks; self-collision still kills
9. Each powerup renders with a distinct colored circle and symbol
10. Active effects HUD shows remaining duration per effect
11. `tsc --noEmit` passes cleanly
12. Existing unit tests pass

---

## Verification Steps

1. `npm run build` — TypeScript compiles cleanly
2. `npm test` — existing tests pass
3. `npm run dev` — powerup appears within ~5 seconds at game start
4. Collect each powerup type and verify its effect and HUD display
5. Let a powerup sit uncollected — it disappears after ~4.5s

---

## Risks & Mitigations

- **Speed effect + accumulator**: effect expiry naturally takes effect on the next RAF iteration — no special handling needed
- **Ghost mode wrap**: `nextHead` returns `null` only for `wallBehavior === 'die'`; suppressing `null` / `hitsExtraWall` is sufficient
- **Crowded grid**: `placePowerUp` returns `null` if no valid cell found; tick silently skips spawning
