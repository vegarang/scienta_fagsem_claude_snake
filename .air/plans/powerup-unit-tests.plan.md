# Plan: Powerup Unit Tests

## Context

Powerups are the most complex subsystem in the game — 5 types, spawn/expiry logic, 4 distinct effect behaviours — yet they have **zero unit tests**. Every other major system (food, snake, walls, levels, core game loop) has dedicated tests. This plan fills that gap with two focused test files following existing patterns exactly.

## Approach

Add tests in two places, matching the project's existing Vitest style:

1. **New file `src/powerups.test.ts`** — tests for `placePowerUp` (mirrors `src/food.test.ts` structure)
2. **Extended `src/game.test.ts`** — tests for in-game powerup behaviour via `tick()` and `getEffectiveTickInterval()`

No production code changes. Pure test additions.

---

## File Changes

| File | Action | What changes |
|------|--------|--------------|
| `src/powerups.test.ts` | **Create** | Tests for `placePowerUp`: placement constraints, RNG determinism, null when no space, type selection |
| `src/game.test.ts` | **Modify** | Append a `describe('powerups')` block covering spawning, expiry, collection effects, effect aging |

---

## Implementation Steps

### Task 1 — `src/powerups.test.ts` (new file)

Tests to write, mirroring `food.test.ts` patterns:

1. `placePowerUp` returns `null` when the entire grid is occupied (snake fills all cells)
2. Position is never on the snake
3. Position is never on an existing wall (`ExtraWall`)
4. Position is never on existing food
5. Position is never on an existing powerup
6. Returns a valid `PowerUp` shape: `{ type, pos, expiresInTicks: POWERUP_BOARD_DURATION }`
7. Type is always one of the five valid `PowerUpType` values
8. Deterministic with a fixed RNG — same seed → same result
9. Different RNG values produce different positions

Imports needed: `placePowerUp`, `POWERUP_BOARD_DURATION`, `POWERUP_TYPES` from `src/powerups.ts`; `Vec2`, `ExtraWall` from `src/types.ts`.

---

### Task 2 — `src/game.test.ts` additions

Add a `describe('powerups', ...)` block at the end. Tests grouped by concern:

**Spawning**
- Countdown decrements each tick
- When countdown reaches 0 and board is empty, a powerup is placed on the board
- When countdown reaches 0 but board already has `POWERUP_MAX_ON_BOARD` powerups, no new one spawns
- Countdown resets to a value in `[POWERUP_SPAWN_MIN, POWERUP_SPAWN_MAX]` after spawn

**Expiry**
- Powerup `expiresInTicks` decrements by 1 each tick
- Powerup is removed from `state.powerups` when `expiresInTicks` reaches 0

**Collection — shrink**
- Snake length decreases by `SHRINK_AMOUNT` when head moves onto a shrink powerup
- Snake length never goes below 1 (even if shorter than `SHRINK_AMOUNT`)
- Collected powerup is removed from `state.powerups`

**Collection — timed effects (speed_boost, slow_down, score_multiplier, ghost_mode)**
- Effect is added to `state.activeEffects` with `remainingTicks === EFFECT_DURATION`
- Collected powerup is removed from `state.powerups`

**Effect aging**
- `remainingTicks` decrements each tick
- Effect is removed from `state.activeEffects` when `remainingTicks` reaches 0

**`getEffectiveTickInterval`**
- Returns `state.tickInterval` when no active effects
- Returns `tickInterval * 0.5` (clamped to 30ms min) when `speed_boost` active
- Returns `tickInterval * 1.8` when `slow_down` active
- `speed_boost` takes precedence over `slow_down` when both active (first branch wins)

**Score multiplier effect**
- Score increases by 2 (not 1) when eating food while `score_multiplier` is active

**Ghost mode effect**
- Snake does not die when hitting an outer wall boundary while `ghost_mode` is active
- Snake does not die when hitting an extra wall while `ghost_mode` is active
- Snake DOES die on wall collision once ghost mode has expired

Helper used: the existing `playingGame(overrides)` factory and `tick()` from `src/game.ts`. Use `() => 0` / `() => 0.999` as deterministic RNG.

---

## Acceptance Criteria

- `npm test` passes with 0 failures
- New test count: ≥ 25 tests across both files (9 in `powerups.test.ts`, ≥ 16 in the new `game.test.ts` block)
- No production code is modified

## Verification Steps

```bash
npm test                   # all tests pass
npm run test:coverage      # powerups.ts and game.ts show increased coverage
```

## Risks & Mitigations

- **Spawning tests depend on RNG determinism** — use a fixed `() => 0` rng passed to `tick()` (the function accepts it as a second param) so tests aren't flaky
- **Ghost mode test requires a die-on-wall level** — use `LEVELS.medium` or `LEVELS.hard` rather than `easy` (which wraps)