# Context

Fresh empty repository for a browser-based Snake game in TypeScript. The goal is to scaffold the project foundation: CLAUDE.md documentation, TypeScript + Vite build tooling, and an index.html entry point. No game logic yet — just a working dev environment that compiles and serves.

---

## Approach

Use **Vite** as the build tool: it provides zero-config TypeScript support, a fast dev server with HMR, and produces optimized static output. No custom webpack config needed. The project will use a `src/` directory with a `main.ts` entry point and a canvas element in `index.html` as the game surface.

---

## File Changes

| Action | File | Purpose |
|--------|------|---------|
| Create | `CLAUDE.md` | Project documentation for Claude Code |
| Create | `package.json` | npm project with Vite + TypeScript deps |
| Create | `tsconfig.json` | TypeScript config targeting ES2020, DOM lib |
| Create | `index.html` | HTML entry with `<canvas>` element |
| Create | `src/main.ts` | Minimal TS entry point (placeholder) |
| Create | `.gitignore` | Ignore node_modules, dist, .env |

---

## Implementation Steps

### Task 1: Project configuration files

1. **Create `CLAUDE.md`** — document project purpose (Snake game, TypeScript, Vite), dev commands (`npm run dev`, `npm run build`), and architecture notes (canvas-based rendering, `src/` for game source).

2. **Create `package.json`** — name `snake-game`, scripts: `dev` (vite), `build` (tsc && vite build), `preview` (vite preview). DevDependencies: `vite`, `typescript`.

3. **Create `tsconfig.json`** — `target: ES2020`, `lib: ["ES2020", "DOM"]`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`, `noEmit: true` (Vite handles emit), `include: ["src"]`.

4. **Create `.gitignore`** — `node_modules/`, `dist/`, `.env`.

### Task 2: HTML and source entry

5. **Create `index.html`** — standard HTML5 shell with a centered `<canvas id="game-canvas" width="400" height="400">`, dark background via inline style, and `<script type="module" src="/src/main.ts">` for Vite.

6. **Create `src/main.ts`** — import nothing yet; select the canvas element, get 2D context, and log `"Snake game ready"` to confirm the pipeline works.

---

## Acceptance Criteria

- `npm install` completes without errors
- `npm run dev` starts Vite dev server and serves `index.html`
- Browser shows a black canvas centered on a dark page
- Browser console prints `"Snake game ready"`
- `npm run build` produces a `dist/` folder with compiled output
- TypeScript strict mode is on and `src/main.ts` has no type errors

---

## Verification Steps

1. `npm install` — no errors
2. `npm run dev` — open `http://localhost:5173`, verify canvas renders and console message appears
3. `npm run build` — verify `dist/` is created
4. `npx tsc --noEmit` — verify zero type errors

---

## Risks & Mitigations

- **Vite version pinning**: Use `"vite": "^6"` to stay on latest stable; Vite 6 supports TS natively without extra plugins.
- **Canvas sizing**: Fixed 400×400 in HTML for now; responsive sizing can be added when game logic is implemented.
