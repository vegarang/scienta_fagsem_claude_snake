# Snake Game

A browser-based Snake game built with TypeScript and Vite.

## Dev Commands

- `npm run dev` — start Vite dev server with HMR at http://localhost:5173
- `npm run build` — type-check with tsc, then build to `dist/`
- `npm run preview` — preview the production build locally

## Architecture

- **Rendering**: HTML5 Canvas (`<canvas id="game-canvas">` in `index.html`)
- **Source**: all game code lives in `src/`
- **Entry point**: `src/main.ts`
- **Build tool**: Vite 6 — handles TypeScript natively, no extra plugins needed
