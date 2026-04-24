# Code Quality & Maintainability Improvements

## Context
The codebase has excellent architecture (pure functional, immutable state, well-typed) and strong unit test coverage on core game logic. However, there are gaps in tooling (no linter exists at all), scattered magic numbers, unvalidated localStorage reads, duplicated grid iteration code, and four peripheral modules with zero test coverage. This plan addresses all of these to make the project easier to maintain and extend.

---

## 1. Tooling & Config

### 1a. Add ESLint + TypeScript ESLint
No linter currently exists. This is the single biggest gap for long-term maintainability.

**Create**: `eslint.config.js` (flat config format, compatible with Vite ecosystem)

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': 'warn',
    },
  }
);
```

**Modify**: `package.json` — add `"lint": "eslint src"` to the `scripts` section and add dev dependencies:
- `eslint`
- `@eslint/js`
- `typescript-eslint`

### 1b. Enforce coverage thresholds
**Modify**: `vitest.config.ts`

Add `thresholds` to `coverage` block:
```ts
thresholds: {
  lines: 80,
  functions: 80,
  branches: 75,
}
```

### 1c. Extend Playwright to Firefox
**Modify**: `playwright.config.ts` — add `{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }` to the `projects` array. Keep Desktop Chrome as the primary. Safari (webkit) is optional due to CI cost.

---

## 2. Source Code Quality

### 2a. Named constants for magic numbers in walls.ts
**Modify**: `src/walls.ts`

Current code (lines 6–9, 20–21, 24, 84) has hardcoded values: `0.25`, `0.70`, `5`, `8`.

Add at the top of the file:
```ts
const MIN_WALL_FRACTION = 0.25;
const MAX_WALL_FRACTION = 0.70;
const SNAKE_SAFE_RADIUS = 5;   // Chebyshev distance
const LOOK_AHEAD_CELLS = 8;    // cells ahead of snake head kept clear
```

Replace all raw numbers with these constants.

### 2b. Type guards for localStorage reads in main.ts
**Modify**: `src/main.ts` lines 32–33

Current code does unchecked `as ThemeId` and `as ColorMode` casts. Add:
```ts
function isValidThemeId(v: string): v is ThemeId {
  return Object.keys(THEMES).includes(v);
}
function isValidColorMode(v: string): v is ColorMode {
  return v === 'light' || v === 'dark';
}
```

Use these guards when reading from `localStorage` so invalid/corrupt values fall back to defaults instead of passing through silently.

### 2c. Grid iteration utility to remove duplication
`src/food.ts`, `src/powerups.ts`, and `src/walls.ts` all contain an identical nested loop:
```ts
for (let x = 0; x < gridSize.x; x++) {
  for (let y = 0; y < gridSize.y; y++) { … }
}
```

**Modify**: `src/snake.ts` — add a pure utility at the bottom:
```ts
export function allCells(gridSize: Vec2): Vec2[] {
  const cells: Vec2[] = [];
  for (let x = 0; x < gridSize.x; x++)
    for (let y = 0; y < gridSize.y; y++)
      cells.push({ x, y });
  return cells;
}
```

Replace the duplicate loops in food.ts, powerups.ts, and walls.ts with `allCells(gridSize).filter(...)`.

### 2d. Unit tests for untested peripheral modules

Four modules have zero test coverage:

**Create**: `src/input.test.ts`
- Test `keyToDirection()` for all arrow keys and WASD keys
- Test `shouldPreventDefault()` returns true for arrow/space and false for other keys

**Create**: `src/scoreboard.test.ts`
- Mock `localStorage` (vitest provides `vi.stubGlobal`)
- Test `loadScoreboard()` returns `[]` when localStorage is empty
- Test `loadScoreboard()` returns `[]` and doesn't throw when JSON is corrupt
- Test `addEntry()` inserts, sorts by score descending, trims to 10 entries
- Test `addEntry()` with identical scores preserves stable order

**Create**: `src/themes.test.ts`
- Test `getThemeVariant()` returns correct object for each `ThemeId` × `ColorMode` combination
- Test all color values in all themes match `/^#[0-9a-fA-F]{3,6}$/` (catches typos in hex codes)

**Create**: `src/sizes.test.ts`
- Test `getSize()` returns correct `Vec2` for each valid size key
- Test `getSize()` with an unknown key falls back to the default (`SIZES.small`)

---

## 3. Update CLAUDE.md

**Modify**: `CLAUDE.md`

Add a new `## Code quality` section documenting:
- Linting: `npm run lint` (ESLint + typescript-eslint)
- Coverage thresholds: 80% lines/functions, 75% branches
- Convention: no magic numbers — use named constants at top of file
- Convention: localStorage reads must use type guards before casting
- Utility: `allCells(gridSize)` in `snake.ts` for grid iteration

---

## File Changes Summary

| File | Action | Change |
|------|--------|--------|
| `eslint.config.js` | **Create** | New flat ESLint config |
| `package.json` | **Modify** | Add `lint` script + 3 dev deps |
| `vitest.config.ts` | **Modify** | Add coverage thresholds |
| `playwright.config.ts` | **Modify** | Add Firefox project |
| `src/walls.ts` | **Modify** | 4 named constants, replace magic numbers |
| `src/main.ts` | **Modify** | Add `isValidThemeId`, `isValidColorMode` guards |
| `src/snake.ts` | **Modify** | Add `allCells()` utility |
| `src/food.ts` | **Modify** | Use `allCells()` |
| `src/powerups.ts` | **Modify** | Use `allCells()` (same file as above) |
| `src/walls.ts` | **Modify** | Use `allCells()` (same file as above) |
| `src/input.test.ts` | **Create** | Unit tests for key mapping |
| `src/scoreboard.test.ts` | **Create** | Unit tests with localStorage mock |
| `src/themes.test.ts` | **Create** | Theme data validation tests |
| `src/sizes.test.ts` | **Create** | Size lookup + fallback tests |
| `CLAUDE.md` | **Modify** | Document new conventions and tooling |

---

## Acceptance Criteria

- `npm run lint` exits 0 with no errors on the current codebase
- `npm run test:coverage` exits 0 with thresholds met (≥80% lines/functions, ≥75% branches)
- `npm test` passes all existing tests plus new tests (≥ 30 new assertions)
- `npm run test:e2e` passes on both Chrome and Firefox
- No raw `as ThemeId` or `as ColorMode` casts remain in `main.ts`
- No literal `0.25`, `0.70`, `5` (as safe radius), or `8` (as look-ahead) in `walls.ts`
- The grid iteration loop appears exactly once (in `snake.ts`) and is referenced in food, powerups, and walls

## Verification Steps

1. `npm install` — confirm new ESLint packages install without conflicts
2. `npm run lint` — confirm zero errors
3. `npm test` — confirm all tests pass, including 4 new test files
4. `npm run test:coverage` — confirm thresholds are met, no uncovered regressions
5. `npm run test:e2e` — confirm both Chrome and Firefox pass
6. Manual: change theme, reload page, verify theme persists (exercises the type-guarded localStorage path)
