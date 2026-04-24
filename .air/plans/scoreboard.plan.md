# Scoreboard Feature Plan

## Context
The snake game currently has a score counter but no persistence. After dying, the score is lost. This plan adds a persistent scoreboard stored in `localStorage`, visible below the game canvas, with an optional name-entry prompt shown on game over.

## Approach
Add a new `src/scoreboard.ts` module for localStorage CRUD, extend `index.html` with the name-entry form and scoreboard table (both below the canvas), and wire up game-over detection in `src/main.ts`. The name-entry form is hidden by default and shown only on game over; if the player submits an empty name, no entry is saved.

---

## File Changes

### 1. **Create** `src/scoreboard.ts`
New module. Exports:
- `ScoreEntry` interface: `{ name: string; score: number; date: string }`
- `loadScoreboard(): ScoreEntry[]` — reads and JSON-parses from `localStorage`, returns `[]` on error/missing
- `addEntry(entry: ScoreEntry): ScoreEntry[]` — appends, sorts descending by score, trims to 10, writes back, returns trimmed list

```typescript
const KEY = 'snake-scoreboard';
const MAX = 10;
```

### 2. **Modify** `index.html`
Two additions after `<canvas id="game-canvas">`:

**Name-entry section** (hidden by default via `hidden` attribute):
```html
<section id="name-entry" hidden>
  <p>Enter your name for the scoreboard:</p>
  <div id="name-entry-controls">
    <input id="name-input" type="text" placeholder="Your name" maxlength="20" autocomplete="off">
    <button id="name-submit">Add to Scoreboard</button>
    <button id="name-skip">Skip</button>
  </div>
</section>
```

**Scoreboard section** (always visible):
```html
<section id="scoreboard">
  <h2>Scoreboard</h2>
  <table id="score-table">
    <thead><tr><th>#</th><th>Name</th><th>Score</th><th>Date</th></tr></thead>
    <tbody id="score-body"></tbody>
  </table>
  <p id="no-scores">No scores yet. Play a game!</p>
</section>
```

**CSS additions** (inside existing `<style>` tag):
- `#name-entry`: styled form area, matches dark theme
- `#name-input`: dark input, white text, monospace
- `#name-submit`, `#name-skip`: button styles matching existing difficulty buttons
- `#scoreboard`: `max-width: 400px`, centered, matches game width
- `table`: full-width, monospace, small font
- `th`/`td`: padding, left-aligned, border-bottom separators
- `#no-scores`: muted placeholder text

### 3. **Modify** `src/main.ts`
Add import:
```typescript
import { loadScoreboard, addEntry, type ScoreEntry } from './scoreboard';
```

- **Phase tracking**: add `prevPhase` variable; on transition to `'gameover'` → show name-entry, focus input
- **Spacebar guard**: skip game-restart when `document.activeElement === nameInputEl`
- **Submit handler** (button click + Enter keydown on input): save entry if name non-empty, hide form, call `renderScoreboard()`
- **Skip handler**: hide form, call `renderScoreboard()` (no save)
- **`renderScoreboard()`**: populates `#score-body`, shows/hides `#no-scores` and `<table>`, called on load and after each submit/skip
- **Restart guard**: hide name-entry form when game restarts via spacebar

---

## Implementation Steps

**Phase 1 — scoreboard module**
1. Create `src/scoreboard.ts` with `ScoreEntry`, `loadScoreboard`, `addEntry` (with try/catch around localStorage)

**Phase 2 — HTML + CSS**
2. Add name-entry section HTML after canvas in `index.html`
3. Add scoreboard section HTML after name-entry in `index.html`
4. Add CSS for both sections in the existing `<style>` tag

**Phase 3 — wire up in main.ts**
5. Import scoreboard functions from `./scoreboard`
6. Query new DOM elements
7. Add `renderScoreboard()` function; call on page load
8. Add `prevPhase` tracking; show name-entry on gameover transition
9. Guard spacebar to skip when name input is focused
10. Wire submit/skip handlers
11. Hide name-entry on game restart (spacebar from gameover)

---

## Acceptance Criteria
- [ ] Scoreboard section always visible below canvas
- [ ] Name-entry form appears after dying
- [ ] Submitting a name adds a row; empty name / skip adds nothing
- [ ] Scoreboard persists across page reloads (localStorage key `snake-scoreboard`)
- [ ] At most 10 entries, sorted highest score first
- [ ] Spacebar in name input does not restart the game
- [ ] Spacebar to restart (without touching form) hides form and restarts normally
- [ ] Columns: rank, name, score, date (YYYY-MM-DD)

## Verification Steps
1. `npm run dev` → play until death → confirm name-entry form appears
2. Enter name, submit → verify scoreboard row with correct score and date
3. Reload → verify entry persists
4. Skip → verify scoreboard unchanged
5. Accumulate 11 scores → verify only top 10 retained
6. `npm test` → all existing unit tests pass
7. `npm run test:e2e` → all existing e2e tests pass

## Risks & Mitigations
- **Spacebar conflict**: guarded by `document.activeElement` check before processing spacebar
- **localStorage unavailable**: `loadScoreboard` and `addEntry` both wrap storage calls in try/catch, return `[]` gracefully
- **Existing e2e tests**: no game logic changes — only new DOM elements added, existing selectors unaffected
