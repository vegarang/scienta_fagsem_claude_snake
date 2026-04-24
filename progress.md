# Progress Log

A record of every Claude task in this project: what was requested, how Claude interpreted it, what was done, and any feedback.

---

**Task 1 — Initial project scaffold** (2026-04-24)
- **Command**: Create a Snake game project skeleton with TypeScript and Vite
- **Interpretation**: Tooling-only scaffold — CLAUDE.md, package.json, tsconfig.json, index.html, and a placeholder `src/main.ts`. No game logic; just the build infrastructure.
- **Outcome**: Completed — commit `be2d308` (`initial skeleton`)
- **User feedback**: No recorded feedback; follow-up task immediately added full game logic.

---

**Task 2 — Full game implementation** (2026-04-24)
- **Command**: Make the game actually work (follow-up after skeleton)
- **Interpretation**: Implement all game modules in one commit: `types.ts`, `game.ts`, `snake.ts`, `food.ts`, `levels.ts`, `input.ts`, `renderer.ts`, and a complete `main.ts` game loop with RAF + tick accumulator. No separate plan file was created for this step.
- **Outcome**: Completed — commit `c2c4c93` (`Initial game working`)
- **User feedback**: No recorded feedback.

---

**Task 3 — Cartoon snake + apple visuals** (2026-04-24)
- **Command**: Give the snake and food a cartoon look
- **Interpretation**: Changes isolated to `src/renderer.ts` only. "Cartoon" interpreted as: rounded body segments with connectors between them, direction-aware eyes with pupils, a forked tongue on the head, and an apple with stem, leaf, and shine highlight.
- **Outcome**: Completed — `src/renderer.ts` rewritten with `drawApple` and `drawSnake` functions; build and all 58 tests pass.
- **User feedback**: No feedback yet.

---

**Task 4 — Fix rapid-reversal bug** (2026-04-24)
- **Command**: Fix the bug where the snake can reverse direction instantly and collide with itself
- **Interpretation**: Root cause identified as `game.ts:39` checking `state.pendingDirection` vs `state.direction`. Concrete crash scenario: player presses RIGHT → DOWN → LEFT in a single tick — the intermediate DOWN update means the LEFT check passes. Fix is a one-line guard comparing against the direction that was actually applied this tick.
- **Outcome**: Completed — changed `game.ts:39` to guard against `state.direction` instead of `state.pendingDirection`; updated `game.test.ts` with two corrected tests. All 59 tests pass.
- **User feedback**: No recorded feedback.

---

**Task 5 — Fix lost input on rapid 180° clicks** (2026-04-24)
- **Command**: When I click rapidly to change direction 180 degrees it sometimes loses my last click
- **Interpretation**: The previous fix (Task 4) introduced a new problem: `queueDirection` validated against `state.direction` (committed), so a rapid sequence like UP → RIGHT → DOWN would reject DOWN because `OPPOSITE[UP] = DOWN`, even though DOWN is valid from the queued RIGHT. Root fix: replace the single `pendingDirection` slot with a 2-entry `directionQueue`. Validation now checks against the last entry in the queue (falling back to `direction`), so each keypress is validated relative to what the snake will actually be doing when that input takes effect.
- **Outcome**: Completed — `types.ts` replaces `pendingDirection: Direction` with `directionQueue: readonly Direction[]`; `game.ts` updated `createGame`, `queueDirection`, and `tick`; `game.test.ts` rewritten with 61 passing tests including a dedicated "rapid turn fix" test.
- **User feedback**: Not yet recorded.
