# Context

On mobile, swiping on the game canvas triggers the browser's native scroll behavior alongside the game's swipe detection. The canvas `touchstart`/`touchend` listeners in `src/main.ts` (lines 340–358) are registered with `{ passive: true }`, meaning `e.preventDefault()` cannot stop the scroll. The D-pad buttons already use `touch-action: manipulation` which prevents double-tap zoom but not scrolling. The canvas has no `touch-action` CSS property set, so the browser defaults to allowing pan/scroll.

# Approach

Add `touch-action: none` to `#game-canvas` in `src/style.css`. This declarative CSS property tells the browser to skip all built-in touch handling (pan, zoom) on the canvas element — no JS changes required. This is more efficient than making listeners non-passive (which would block the compositor thread).

# File Changes

**Modify** [style.css](air-file://s36i8refhtg1abb7555c/Users/vegard/code/scienta/scienta_fagsem_claude_snake/src/style.css?type=file&root=%252F) — add `touch-action: none` to the `#game-canvas` rule (or create a new rule for it).

# Implementation Steps

1. In `src/style.css`, find the `#game-canvas` selector (or add one) and add:
   ```css
   #game-canvas {
     touch-action: none;
   }
   ```
   That's the entire change.

# Acceptance Criteria

- Swiping on the canvas on a mobile device (or Chrome DevTools touch emulation) does **not** scroll the page.
- Swipe gestures still register as directional input in-game.
- Tap to start/pause still works.
- D-pad buttons are unaffected.
- Desktop mouse behavior is unaffected.

# Verification Steps

1. `npm run dev`, open on a mobile device or Chrome DevTools with touch emulation enabled.
2. During gameplay, swipe in all four directions — page must not scroll.
3. Tap the canvas — game should start/pause.
4. Verify D-pad buttons still work.

# Risks & Mitigations

- **Zoom disabled on canvas**: `touch-action: none` also disables pinch-to-zoom on the element, but the game canvas has no zoom feature so this is intentional.
