# Add Per-Powerup Sound Effects

## Context
The Snake game already has a Web Audio API sound system (`src/audio.ts`) with a single `playPowerup()` function that plays the same ascending 3-note chord for every powerup. All five powerup types (`speed_boost`, `slow_down`, `score_multiplier`, `shrink`, `ghost_mode`) currently trigger the same sound. The goal is to give each type a distinct sound character so players get audio feedback about *which* powerup they collected.

## Approach
Change `playPowerup()` to accept a `PowerUpType` parameter and dispatch to one of five private sound functions. Each sound is synthesized with the existing Web Audio API helpers (`playTone` for simple tones, raw `AudioContext` for sweeps/shimmer). In `main.ts`, the detection block already captures `prevActiveCount` and `prevSnakeLen`; extend it to identify the collected type and pass it through.

---

## File Changes

### `src/audio.ts` — Modify
Add a `PowerUpType` import at the top. Replace the current `playPowerup()` (lines 48–52) with a dispatcher plus five private functions:

| Powerup | Sound character | Technique | Parameters |
|---|---|---|---|
| `speed_boost` | Snappy rising beeps | 3× `playTone` | 600 Hz / 750 Hz / 900 Hz, `square`, 55 ms each, delays 0 / 60 / 120 ms |
| `slow_down` | Descending wobble sweep | Raw `AudioContext` | 460 → 200 Hz sine over 500 ms |
| `score_multiplier` | Coin jingle | 2× `playTone` | 523 Hz (C5) then 784 Hz (G5), `sine`, 100 ms each, delay 0 / 110 ms |
| `shrink` | Deflating zip | Raw `AudioContext` | 1100 → 120 Hz sawtooth over 200 ms |
| `ghost_mode` | Ethereal shimmer | 3× `playTone` detuned | 440 / 447 / 434 Hz, `sine`, 0.65 s, delays 0 / 30 / 60 ms |

### `src/main.ts` — Modify
Lines 216–238. Capture `prevActiveEffects` alongside the existing snapshots, then detect which powerup type was collected and pass it to `playPowerup(type)`.

---

## Implementation Steps

1. **`src/audio.ts`**: Add `import type { PowerUpType } from './types';` at line 1.
2. **`src/audio.ts`**: Replace `playPowerup()` (lines 48–52) with a `playPowerup(type: PowerUpType)` dispatcher that switches on type and plays the appropriate synthesized sound.
3. **`src/main.ts`**: After line 219 (`const prevSnakeLen = state.snake.length;`), add `const prevActiveEffects = state.activeEffects;`.
4. **`src/main.ts`**: Replace lines 236–238 with a block that calls `playPowerup('shrink')` when snake shrunk, or finds the newly-added active effect and calls `playPowerup(newEffect.type)` otherwise.

---

## Acceptance Criteria
- Collecting `speed_boost` plays 3 quick rising beeps.
- Collecting `slow_down` plays a slow descending sine sweep.
- Collecting `score_multiplier` plays a two-note ascending coin jingle.
- Collecting `shrink` plays a short downward zip.
- Collecting `ghost_mode` plays a soft shimmering cluster of tones.
- `npm run build` passes without TypeScript errors.
- Mute toggle suppresses all powerup sounds as before.
- Existing `playEat()` and `playDie()` sounds are unchanged.

## Verification
1. `npm run build` — must complete without errors.
2. `npm run dev` → open browser → collect each powerup type and confirm distinct sounds.
3. `npm test` — all existing tests must still pass.
4. Toggle mute (M key) and collect a powerup — no sound should play.
