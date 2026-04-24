# Plan: Convert Difficulty and Size Selectors to Dropdowns

## Context
The difficulty and size controls are currently implemented as button groups (three `<button>` elements each, toggling an `.active` CSS class). The user wants them replaced with native HTML `<select>` dropdowns.

## Approach
Replace the two button-group `<div>` elements in `index.html` with `<select>` elements, style them to match the existing dark-themed HUD, and update `src/main.ts` to listen for `change` events on the selects instead of `click` events on buttons. The `setActiveButton` / `setActiveSizeButton` helpers become unnecessary and will be removed.

---

## File Changes

### `index.html` — Modify

1. **Remove** button-group CSS (`.active`, `#difficulty button`, `#size button` rules).
2. **Add** `<select>` CSS — dark background (`#333`), light text, green accent on focus, matching monospace font and padding.
3. **Replace** the two button-group `<div>`s with:

```html
<div id="difficulty">
  <select id="difficulty-select" aria-label="Difficulty">
    <option value="easy">Easy</option>
    <option value="medium">Medium</option>
    <option value="hard">Hard</option>
  </select>
</div>
<div id="size">
  <select id="size-select" aria-label="Size">
    <option value="small">Small</option>
    <option value="medium">Medium</option>
    <option value="large">Large</option>
  </select>
</div>
```

### `src/main.ts` — Modify

1. Replace `querySelectorAll<HTMLButtonElement>('#difficulty button')` with `querySelector<HTMLSelectElement>('#difficulty-select')`.
2. Replace `querySelectorAll<HTMLButtonElement>('#size button')` with `querySelector<HTMLSelectElement>('#size-select')`.
3. **Delete** `setActiveButton` and `setActiveSizeButton` helper functions.
4. Set initial `.value` on each select from URL params:
   ```ts
   difficultySelect.value = levelId;
   sizeSelect.value = sizeId;
   ```
5. Replace button `click` listeners with select `change` listeners:
   ```ts
   difficultySelect.addEventListener('change', () => {
     levelId = difficultySelect.value;
     state = createGame(getLevel(levelId), grid);
   });

   sizeSelect.addEventListener('change', () => {
     sizeId = sizeSelect.value;
     applySize(sizeId);
   });
   ```

---

## Implementation Steps

**Step 1 — Update HTML structure** (`index.html`)
- Remove old button-group CSS rules for `#difficulty button`, `#size button`, `.active`.
- Add `select` styles: dark `#333` background, `#ccc` text, `1px solid #555` border, `4px` border-radius, `3px 8px` padding, `13px` monospace font, green `#4caf50` border on `:focus`.
- Swap button groups for `<select id="difficulty-select">` and `<select id="size-select">`.

**Step 2 — Update TypeScript wiring** (`src/main.ts`)
- Replace button NodeList queries with single-element select queries.
- Remove `setActiveButton` / `setActiveSizeButton`.
- Initialise `.value` on both selects after they are queried.
- Add `change` event listeners as shown above.

---

## Acceptance Criteria
- The HUD shows two `<select>` dropdowns instead of button groups.
- Default selection matches the URL param (or `easy` / `small` when absent).
- Changing the difficulty dropdown immediately resets the game at the chosen difficulty.
- Changing the size dropdown immediately resizes the canvas and resets the game.
- The dropdowns are visually consistent with the dark HUD theme.

## Verification Steps
1. `npm run dev` — open http://localhost:5173.
2. Confirm two dropdowns appear in the HUD with correct default selections.
3. Change difficulty → game resets with new speed/wall settings.
4. Change size → canvas resizes and game resets.
5. Open `?level=hard&size=large` → both dropdowns pre-select the correct values.
6. `npm test` — all unit tests pass.
7. `npm run test:e2e` — Playwright tests pass (update any selectors that targeted the old buttons).

## Risks & Mitigations
- **E2E tests target buttons**: Playwright tests may use `#difficulty button` or `[data-level]` selectors. After implementation, check test files and update to target `#difficulty-select` and `#size-select`.