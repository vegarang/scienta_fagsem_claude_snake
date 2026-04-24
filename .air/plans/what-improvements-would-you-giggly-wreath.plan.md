# UX Improvement Recommendations

## Context

The game is a well-structured Snake implementation with themes, powerups, difficulty levels, and a scoreboard. The core mechanics and architecture are solid. However, several gaps reduce moment-to-moment player satisfaction and accessibility. This plan identifies the highest-leverage UX improvements, ordered by impact vs effort.

---

## Priority 1 — High Impact, Feasible

### 1. Mobile Touch Controls
**Problem:** No touch support. The game is entirely keyboard-driven, locking out mobile users entirely.  
**Fix:** Add on-screen D-pad arrow buttons below the canvas (or detect swipe gestures) that feed into the existing direction queue in `src/input.ts`.  
**Files:** `src/input.ts`, `index.html`, `src/main.ts`

### 2. Score Pop-up Animations
**Problem:** Eating food gives +1 point but there's no satisfying feedback — just a number update in the corner.  
**Fix:** Render a floating "+1" or "+2" (during multiplier) text at the food position that fades upward over ~0.5s. This happens entirely in `src/renderer.ts` using a short-lived animation queue stored in `GameState`.  
**Files:** `src/types.ts` (add `FloatingText[]` to `GameState`), `src/game.ts`, `src/renderer.ts`

### 3. "New High Score!" Celebration
**Problem:** Game over screen says "Score: N — Space to restart" whether you broke the record or not. No recognition of achievement.  
**Fix:** Compare final score against `localStorage` scoreboard on game over. If it's a new #1, show "NEW HIGH SCORE!" in the overlay before the name entry modal. A simple flash/highlight in the existing overlay is enough.  
**Files:** `src/game.ts` or `src/main.ts`, `index.html` (overlay text element)

### 4. Countdown Before Game Starts
**Problem:** Pressing Space immediately starts the game, so players can accidentally die in the first tick before reorienting their hand.  
**Fix:** Add a `countdown` phase (3→2→1→GO) between idle/gameover and playing. The canvas overlay shows the current number, then transitions to `playing`. No input is processed during countdown.  
**Files:** `src/types.ts` (add `'countdown'` to phase union), `src/game.ts`, `src/renderer.ts`, `src/main.ts`

---

## Priority 2 — Medium Impact

### 5. Snake Death Animation
**Problem:** Death is instantaneous — the game over overlay appears with no visual transition. Players sometimes don't know what killed them.  
**Fix:** Add a brief `dying` phase (~0.5s) where the snake flashes red before the game over overlay appears. Optionally show a "hit wall" or "hit self" message.  
**Files:** `src/types.ts`, `src/game.ts`, `src/renderer.ts`

### 6. Powerup Tooltip Legend
**Problem:** Powerup icons appear on the board (⚡ ❄ ×2 ✂ ◈) but there's no explanation of what they do. New players don't know what to chase or avoid.  
**Fix:** Add a collapsible legend below the canvas (or a hover tooltip on the HUD powerup pills) explaining each powerup. Static HTML is sufficient.  
**Files:** `index.html`

### 7. Game Over Stats Panel
**Problem:** The game over screen only shows the score. Players have no sense of how long they survived or how big their snake got.  
**Fix:** Track `ticksAlive` and `maxLength` in `GameState`. Show "Length: N · Ticks: N" below the score on the game over overlay.  
**Files:** `src/types.ts`, `src/game.ts`, `src/renderer.ts`

---

## Priority 3 — Quick Wins

### 8. Sound Effects (Web Audio API)
**Problem:** No audio at all — eating, death, and powerup collection have zero auditory feedback.  
**Fix:** Use the Web Audio API (no external deps needed) to generate short beeps: eat food (high beep), collect powerup (chord), die (descending tone). Volume controlled by a mute toggle in the header.  
**Files:** New `src/audio.ts`, `src/main.ts`, `index.html`

### 9. Pause Button On-Screen
**Problem:** Pausing requires knowing the spacebar shortcut. No visible pause button exists.  
**Fix:** Add a small ⏸ button overlay on the canvas (top-right corner) that triggers pause. The existing space-key logic already handles the state transition.  
**Files:** `index.html`, `src/main.ts`

### 10. Prevent Grid/Difficulty Change Mid-Game
**Problem:** Changing the difficulty or size dropdowns mid-game resets the board, which can be accidental and disorienting.  
**Fix:** Disable the dropdowns while `phase === 'playing' || phase === 'paused'`. Re-enable them on idle/gameover.  
**Files:** `src/main.ts`

---

## Recommended Implementation Order

If implementing all of these, suggested order for a good development flow:

1. **#10** (disable dropdowns mid-game) — trivial, prevents broken states
2. **#4** (countdown) — touches state machine, sets up pattern for #5
3. **#5** (death animation) — builds on countdown's phase addition
4. **#2** (score pop-ups) — adds FloatingText to GameState, good warm-up for renderer work
5. **#3** (high score celebration) — quick win in overlay logic
6. **#7** (game over stats) — extends GameState minimally
7. **#6** (powerup legend) — pure HTML, zero risk
8. **#9** (pause button) — pure HTML + one event listener
9. **#8** (sound effects) — new module, self-contained
10. **#1** (mobile touch) — largest scope, save for last

---

## Acceptance Criteria (per improvement)

| # | Criterion |
|---|-----------|
| 1 | Swipe or on-screen buttons change direction on a real mobile device |
| 2 | "+1"/"+2" text appears at food position and fades within 500ms |
| 3 | "NEW HIGH SCORE!" appears on game over when score beats current #1 |
| 4 | 3-2-1 countdown visible before snake moves; space during countdown is ignored |
| 5 | Snake flashes for ~500ms before game over overlay appears |
| 6 | Each powerup symbol has a readable label visible without starting a game |
| 7 | Game over overlay shows final snake length and ticks survived |
| 8 | Audible feedback on eat/collect/die; mute toggle persists in localStorage |
| 9 | Clicking ⏸ button pauses and resumes correctly |
| 10 | Dropdowns are `disabled` while playing or paused; re-enable on idle/gameover |

---

## Verification

- `npm test` — existing unit tests must still pass after any state changes
- `npm run test:e2e` — Playwright tests verify game lifecycle
- Manual: play through each difficulty, collect each powerup, trigger game over
- Mobile: test touch input in Chrome DevTools device emulator
