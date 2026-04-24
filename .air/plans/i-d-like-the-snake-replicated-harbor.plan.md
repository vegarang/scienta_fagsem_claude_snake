# Plan: Cartoon Snake and Apple Visuals

## Context

The game currently renders everything as plain filled rectangles with flat colors. The user wants the snake to look more like a cartoon snake (rounded, eyes, tongue, connected segments) and the food to look more like a real apple (circular shape, stem, leaf, shine).

---

## Approach

All changes are confined to `src/renderer.ts`. No other files need modification.

- **Snake body**: Draw each segment as a `roundRect`, then fill connector rectangles between adjacent segments with the same color so the rounded corners don't leave gaps — giving a smooth, tube-like appearance.
- **Snake head**: Rounded rect with two small white eyes (with dark pupils) positioned on the leading face based on `state.direction`, plus a forked red tongue sticking out in the direction of travel.
- **Apple**: Replace the `fillCell` rectangle with a red circle, a brown stem, a green leaf ellipse, and a small white shine ellipse.

---

## File Changes

**Modify** `src/renderer.ts`

### 1. Add `drawApple(ctx, food)` function

Replace the `fillCell(food, 2, colors.food)` call (line 92) with a dedicated function that:

```
const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
const cy = food.y * CELL_SIZE + CELL_SIZE / 2;
const r = CELL_SIZE / 2 - 2;          // ~8px radius

// Body (red circle)
ctx.beginPath();
ctx.arc(cx, cy + 1, r, 0, Math.PI * 2);
ctx.fillStyle = '#e63030';
ctx.fill();

// Stem (brown rect, 2px wide, 5px tall, above center)
ctx.fillStyle = '#7a4000';
ctx.fillRect(cx - 1, cy - r - 4, 2, 5);

// Leaf (green ellipse, tilted 45°)
ctx.fillStyle = '#3aaa3a';
ctx.beginPath();
ctx.ellipse(cx + 4, cy - r - 1, 5, 2.5, Math.PI / 4, 0, Math.PI * 2);
ctx.fill();

// Shine (white semi-transparent ellipse)
ctx.fillStyle = 'rgba(255,255,255,0.35)';
ctx.beginPath();
ctx.ellipse(cx - 3, cy - 2, 3, 2, -Math.PI / 5, 0, Math.PI * 2);
ctx.fill();
```

### 2. Add `drawSnake(ctx, snake, direction)` function

**Body segments** (all except index 0):

For each body segment, draw a rounded rect (radius 4) inset 1px:
```
ctx.roundRect(x * CS + 1, y * CS + 1, CS - 2, CS - 2, 4);
```

Between each pair of adjacent segments, compute the overlap strip and fill it (no rounding) with `colors.snakeBody` to bridge the gap between rounded corners. The strip is a 2px-wide rectangle placed where the two segments share an edge.

**Head** (index 0):

Draw a slightly lighter rounded rect (radius 5) with `colors.snakeHead`. Then:

- **Eyes**: Two white circles (r=2.5) with dark pupils (r=1), placed on the leading face. Offset 4px apart perpendicular to direction:
  - UP: eyes near top edge, side-by-side horizontally
  - DOWN: eyes near bottom edge, side-by-side horizontally
  - LEFT: eyes near left edge, stacked vertically
  - RIGHT: eyes near right edge, stacked vertically

- **Tongue**: Two lines forming a fork, drawn 4px out from the leading face in `#ff2255`, 1px wide.

Helper to resolve eye/tongue anchor from direction:
```
function leadingOffset(dir): { dx, dy }
  UP    → { 0, -1 }
  DOWN  → { 0,  1 }
  LEFT  → { -1, 0 }
  RIGHT → { 1,  0 }
```

### 3. Update `render()` call sites

- Replace the food `fillCell` call with `drawApple(ctx, state.food)`.
- Replace the snake head/body `forEach` loop with `drawSnake(ctx, state.snake, state.direction)`.

---

## Implementation Steps

1. Add `drawApple` function above `render()` in `src/renderer.ts`.
2. Add `drawSnake` function above `render()` — body first (index 1..n), then head (index 0) drawn on top.
3. In `render()`, replace lines 92 and 94-97 with calls to `drawApple` and `drawSnake`.
4. Remove any now-unused `colors.snakeHead` / `colors.snakeBody` / `colors.food` if they are no longer referenced (or keep them as local constants inside the new functions).

---

## Acceptance Criteria

- Snake body segments appear connected (no visible rectangular gaps between segments).
- Snake head has two visible eyes oriented toward the direction of movement.
- Snake head has a small forked tongue pointing in the direction of movement.
- Food renders as a round red apple shape with a visible stem, a green leaf, and a shine highlight — not a rectangle.
- No regression: walls, overlays, score text, and game-over screen are unchanged.
- TypeScript compiles without errors (`npm run build`).
- Unit tests pass (`npm test`).

---

## Verification

```bash
npm run dev         # open http://localhost:5173 and play; inspect snake + apple visuals
npm run build       # confirm no TS errors
npm test            # confirm game-logic tests still pass
npm run test:e2e    # confirm Playwright tests pass
```

Manual checks:
- Change direction and confirm eyes/tongue rotate to face the new direction immediately.
- Eat an apple and confirm it respawns with the same apple appearance.
- Reach game-over screen and confirm overlay still renders correctly.
