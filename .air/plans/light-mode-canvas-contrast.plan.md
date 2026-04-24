# Fix: Game board invisible in light mode

## Context

In light mode, the game canvas "disappears" against the page background. The root cause is that `canvas.background` in every light-mode theme is nearly identical to the CSS `--bg` page color (contrast ratio ~1.01–1.02). Dark mode has no issue because canvas backgrounds are very dark (#000000 etc.) against slightly less dark page backgrounds.

## Approach

Two targeted changes, no architecture changes:
1. **Darken light-mode `canvas.background` values** in `src/themes.ts` to mid-tones that are clearly distinct from the near-white page backgrounds, while staying coherent with each theme's palette.
2. **Add a `box-shadow` to `canvas`** in `src/style.css` to make the canvas boundary crisp regardless of color proximity.

## File Changes

**Modify** `src/themes.ts` — 5 `canvas.background` values changed, one per theme's light variant:

| Theme | Old | New |
|-------|-----|-----|
| Classic (line 57) | `#e8ffe8` | `#c0e8c0` |
| Ocean (line 86) | `#e8f4ff` | `#bcd8f0` |
| Sunset (line 115) | `#fff4ee` | `#f0d0b0` |
| Forest (line 144) | `#f0f5e8` | `#cce0b0` |
| Minimal (line 173) | `#f5f5f5` | `#dcdcdc` |

**Modify** `src/style.css` — add 1 line to the `canvas` rule (currently lines 196–198):
```css
canvas {
  display: block;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
}
```

## Acceptance Criteria

- In light mode with any theme, the game canvas is visually distinct from the page background
- Game elements (snake, food, walls) remain readable against the new backgrounds
- Dark mode appearance is unchanged
- Canvas has a subtle shadow boundary in both modes

## Verification

1. `npm run dev` → open http://localhost:5173
2. Toggle to light mode (☀️) and switch through all 5 themes — canvas clearly visible in each
3. Toggle back to dark mode — verify no regression
4. `npm test` — all tests pass
