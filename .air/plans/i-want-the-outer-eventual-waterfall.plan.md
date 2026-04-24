# Plan: Visual Outer Walls for Medium and Hard Difficulty

## Context

Medium and hard levels both use `wallBehavior: 'die'`, meaning the snake is killed when it leaves the grid boundary. Currently, there is no visual indicator of this boundary — the canvas just ends. The user wants to see a visible wall drawn along the outer edges of the game grid for these two difficulty levels, consistent with the existing wall visual style.

## Approach

Add a `drawBoundaryWall()` function in `src/renderer.ts` that draws a thick stroke border around the canvas perimeter using the existing `colors.wall` color (`#888888`). Call it from `render()` when `state.level.wallBehavior === 'die'`. This is purely cosmetic — no game logic or type changes needed. Drawing it early in the render sequence (right after background clear) ensures the snake renders on top at the edges.

## File Changes

- **Modify** `src/renderer.ts` — add `drawBoundaryWall()` helper and call it conditionally in `render()`

## Implementation Steps

### Task 1: Add boundary wall drawing function

In `src/renderer.ts`, after `drawWalls()` (line 56), add:

```ts
function drawBoundaryWall(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
}
```

### Task 2: Call it in `render()` when wall behavior is `'die'`

In `render()`, after the background fill (line 226) and before `drawWalls()` (line 228), insert:

```ts
if (state.level.wallBehavior === 'die') {
  drawBoundaryWall(ctx, canvas, colors.wall);
}
```

## Acceptance Criteria

- **Easy**: no border drawn around the canvas
- **Medium**: gray (`#888888`) border around the full canvas perimeter
- **Hard**: same border plus the two existing interior vertical walls remain
- Snake renders visually on top of the border when at edge cells
- No changes to types, game logic, or collision detection

## Verification Steps

1. `npm run dev`, open in browser
2. Easy — confirm no outer wall border
3. Medium — confirm gray border around grid perimeter
4. Hard — confirm border + interior vertical walls both present
5. Play into the edge on Medium/Hard — confirm snake still dies
6. `npm test` — confirm no regressions