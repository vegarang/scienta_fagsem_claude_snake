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
- **Outcome**: Planned (see `.air/plans/i-d-like-the-snake-replicated-harbor.plan.md`)
- **User feedback**: Not yet implemented; no feedback recorded.

---

**Task 4 — Fix rapid-reversal bug** (2026-04-24)
- **Command**: Fix the bug where the snake can reverse direction instantly and collide with itself
- **Interpretation**: Root cause identified as `game.ts:39` checking `state.pendingDirection` vs `state.direction`. Concrete crash scenario: player presses RIGHT → DOWN → LEFT in a single tick — the intermediate DOWN update means the LEFT check passes. Fix is a one-line guard comparing against the direction that was actually applied this tick.
- **Outcome**: Planned (see `.air/plans/fix-snake-rapid-reversal.plan.md`)
- **User feedback**: Not yet implemented; no feedback recorded.
