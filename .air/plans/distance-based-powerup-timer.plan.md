# Powerup Timer Based on Distance to Snake Head

## Context

Powerups currently expire after a fixed 30 ticks (`POWERUP_BOARD_DURATION`) regardless of where they spawn relative to the snake. On a 20×20 grid the maximum Manhattan distance from head to a corner is ~38 moves, so a fixed 30-tick window makes far-corner powerups unreachable. The fix: scale `expiresInTicks` by the Manhattan distance at spawn time so the player always has enough ticks to reach it.

## Approach

Add a `snakeHead: Vec2` parameter to `placePowerUp`. At spawn, compute the Manhattan distance from head to the chosen position and set `expiresInTicks = Math.max(POWERUP_BOARD_DURATION, distance * POWERUP_DISTANCE_FACTOR)`. Manhattan distance is the right metric because the snake moves one cell per tick in a cardinal direction. A factor of 2 provides slack for non-direct paths around the body and walls. The minimum floor (`POWERUP_BOARD_DURATION = 30`) preserves the existing behaviour for nearby spawns.

## File Changes

### Modify: `src/powerups.ts`

1. **Line 6** — Add constant after `POWERUP_BOARD_DURATION`:
   ```typescript
   export const POWERUP_DISTANCE_FACTOR = 2;
   ```

2. **Lines 19–26** — Insert `snakeHead: Vec2` before optional `rng`:
   ```typescript
   export function placePowerUp(
     snake: readonly Vec2[],
     walls: readonly ExtraWall[],
     powerups: readonly PowerUp[],
     food: Vec2,
     gridSize: Vec2,
     snakeHead: Vec2,
     rng: () => number = Math.random,
   ): PowerUp | null {
   ```

3. **Line 37** — Replace the return statement:
   ```typescript
   const distance = Math.abs(pos.x - snakeHead.x) + Math.abs(pos.y - snakeHead.y);
   return { type, pos, expiresInTicks: Math.max(POWERUP_BOARD_DURATION, distance * POWERUP_DISTANCE_FACTOR) };
   ```

### Modify: `src/game.ts`

4. **Line 143** — Pass `newSnake[0]` (head) as `snakeHead`, shifting `rng` one position right:
   ```typescript
   const spawned = placePowerUp(newSnake, allWalls, boardPowerups, newFood, gridSize, newSnake[0], rng);
   ```

### Modify: `src/powerups.test.ts`

5. **Line 2** — Import new constant:
   ```typescript
   import { placePowerUp, POWERUP_BOARD_DURATION, POWERUP_DISTANCE_FACTOR, POWERUP_TYPES } from './powerups';
   ```

6. **After line 7** — Add shared head constant:
   ```typescript
   const HEAD: Vec2 = { x: 0, y: 0 };
   ```

7. **All `placePowerUp` call sites** — Insert `HEAD` before `rng` (or at end for calls without `rng`).

8. **Line 55** — Relax the `expiresInTicks` assertion:
   ```typescript
   expect(p!.expiresInTicks).toBeGreaterThanOrEqual(POWERUP_BOARD_DURATION);
   ```

9. **After line 76** — Add new distance-formula test:
   ```typescript
   it('scales expiresInTicks by distance from head', () => {
     const head: Vec2 = { x: 0, y: 0 };
     const p = placePowerUp([], [], [], FOOD, GRID, head, () => 0.9999);
     expect(p).not.toBeNull();
     const distance = Math.abs(p!.pos.x - head.x) + Math.abs(p!.pos.y - head.y);
     expect(p!.expiresInTicks).toBe(
       Math.max(POWERUP_BOARD_DURATION, distance * POWERUP_DISTANCE_FACTOR)
     );
   });
   ```

## Verification

```bash
npm test       # all unit tests must pass, including new distance test
npm run build  # TypeScript must compile clean
```
