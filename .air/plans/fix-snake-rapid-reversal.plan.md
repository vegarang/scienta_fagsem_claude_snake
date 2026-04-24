# Fix: Snake self-collision on rapid direction reversal

## Root Cause

`queueDirection` in [game.ts](air-file://s36i8refhtg1abb7555c/Users/vegard/code/scienta/scienta_fagsem_claude_snake/src/game.ts?type=file&root=%252F) line 39 checks against `state.pendingDirection` (the *queued* direction) instead of `state.direction` (the *committed* direction):

```
if (dir === OPPOSITE[state.pendingDirection]) return state;
```

**Crash scenario** (all before a single tick):
1. Snake moving RIGHT → `direction: 'RIGHT'`, `pendingDirection: 'RIGHT'`
2. Press DOWN → not opposite to RIGHT → accepted, `pendingDirection = 'DOWN'`
3. Press LEFT → not opposite to DOWN (=UP) → **accepted**, `pendingDirection = 'LEFT'`
4. Tick: snake moves LEFT into its own body → game over

`state.direction` is updated each tick to the applied direction and always reflects the actual snake orientation — the correct guard value.

## File Changes

- **Modify** [game.ts](air-file://s36i8refhtg1abb7555c/Users/vegard/code/scienta/scienta_fagsem_claude_snake/src/game.ts?type=file&root=%252F) line 39 — one-line fix
- **Modify** [game.test.ts](air-file://s36i8refhtg1abb7555c/Users/vegard/code/scienta/scienta_fagsem_claude_snake/src/game.test.ts?type=file&root=%252F) lines 49–53 — update test that validates the buggy behaviour

## Implementation Steps

**Step 1 — Fix the guard** in [game.ts](air-file://s36i8refhtg1abb7555c/Users/vegard/code/scienta/scienta_fagsem_claude_snake/src/game.ts?type=file&root=%252F):
```typescript
// Before (line 39)
if (dir === OPPOSITE[state.pendingDirection]) return state;
// After
if (dir === OPPOSITE[state.direction]) return state;
```

**Step 2 — Update tests** in [game.test.ts](air-file://s36i8refhtg1abb7555c/Users/vegard/code/scienta/scienta_fagsem_claude_snake/src/game.test.ts?type=file&root=%252F), replacing the incorrect test at lines 49–53:

Remove:
```typescript
it('allows perpendicular direction after partial turn', () => {
  const state = playingGame({ direction: 'RIGHT', pendingDirection: 'UP' });
  expect(queueDirection(state, 'LEFT').pendingDirection).toBe('LEFT');
});
```

Add two correct tests:
```typescript
it('rejects reversal even when pendingDirection differs from direction', () => {
  const state = playingGame({ direction: 'RIGHT', pendingDirection: 'DOWN' });
  expect(queueDirection(state, 'LEFT').pendingDirection).toBe('DOWN');
});

it('allows perpendicular direction once prior turn is committed', () => {
  const state = playingGame({ direction: 'UP', pendingDirection: 'UP' });
  expect(queueDirection(state, 'LEFT').pendingDirection).toBe('LEFT');
});
```

## Acceptance Criteria

- Pressing RIGHT → DOWN → LEFT rapidly (within one tick) does **not** crash the snake
- A direction opposite to `state.direction` is always rejected, regardless of `pendingDirection`
- `npm test` passes with updated tests

## Verification

1. `npm test` — all tests pass
2. Manual: move right, press down then immediately left — no crash
3. Manual: move right, wait, press left — still blocked (direct reversal)
