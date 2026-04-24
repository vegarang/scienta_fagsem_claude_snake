# Snake Game

A browser-based Snake game built with TypeScript and Vite.

## Dev Commands

- `npm run dev` — start Vite dev server with HMR at http://localhost:5173
- `npm run build` — type-check with tsc, then build to `dist/`
- `npm run preview` — preview the production build locally

## Testing

- `npm test` — Vitest unit tests (game logic, runs in Node, no DOM)
- `npm run test:watch` — Vitest in watch mode
- `npm run test:coverage` — coverage report in `coverage/`
- `npm run test:e2e` — Playwright browser tests (starts dev server automatically)

## Architecture

- **Rendering**: HTML5 Canvas (`<canvas id="game-canvas">` in `index.html`)
- **Source**: all game code lives in `src/`
- **Entry point**: `src/main.ts` — game loop (RAF + tick accumulator), wires all modules
- **Build tool**: Vite 6 — handles TypeScript natively, no extra plugins needed

### Module overview

| File | Responsibility |
|------|----------------|
| `src/types.ts` | Shared interfaces: `Vec2`, `Direction`, `GameState`, `LevelConfig`, … |
| `src/levels.ts` | Level configs as plain data — **add new levels here only** |
| `src/snake.ts` | Pure movement + collision helpers (DOM-free) |
| `src/food.ts` | Food placement with injectable RNG for deterministic tests |
| `src/game.ts` | State machine: pure `(GameState) => GameState` functions |
| `src/input.ts` | Keyboard → `Direction` mapping |
| `src/renderer.ts` | Canvas drawing — reads `GameState`, no logic |
| `src/main.ts` | Entry point, RAF + tick accumulator game loop |

### Adding a new level

Add one object to the `LEVELS` record in `src/levels.ts`. No other files need changing.
Level picks up automatically via the `?level=<id>` URL param.

### Level selection

Append `?level=easy`, `?level=medium`, or `?level=hard` to the URL.
Default is `easy`.
