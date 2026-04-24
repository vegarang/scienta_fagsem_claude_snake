# Context

The user wants a `progress.md` documenting all Claude tasks so far, with emphasis on how Claude interpreted each command and what feedback was given. `CLAUDE.md` should also be updated so future agents keep this file current.

---

## What was found

### Git history
- `be2d308` — `initial skeleton`: Vite + TS + canvas scaffolding only
- `c2c4c93` — `Initial game working`: complete snake game (all `src/` modules)

### Plans in `.air/plans/` (staged, not committed)

| Plan | Covers | Status |
|------|--------|--------|
| `i-want-to-create-eager-locket.plan.md` | Initial project scaffold | ✅ Completed (be2d308) |
| `i-d-like-the-snake-replicated-harbor.plan.md` | Cartoon snake + apple visuals | 🕐 Planned |
| `fix-snake-rapid-reversal.plan.md` | One-line bug fix in `game.ts:39` | 🕐 Planned |

Note: the full-game implementation (`c2c4c93`) has no separate plan file — it was done as a follow-up after the skeleton.

### How Claude interpreted commands (from plan files)
- **Skeleton**: Interpreted narrowly as tooling-only — CLAUDE.md, package.json, tsconfig, index.html, placeholder `main.ts`. No game logic at all.
- **Full game**: Built all modules (`types`, `game`, `snake`, `food`, `levels`, `input`, `renderer`, `main`) in one commit.
- **Cartoon visuals**: Isolated all changes to `src/renderer.ts` only. "Cartoon" interpreted as: rounded body segments with connectors, direction-aware eyes + pupils, forked tongue, apple with stem/leaf/shine.
- **Rapid reversal bug**: Claude identified root cause as checking `state.pendingDirection` vs `state.direction` on `game.ts:39`, documented a concrete crash scenario (RIGHT → DOWN → LEFT in one tick).

---

## File Changes

### Create `progress.md` (project root)

Covers all 4 tasks with fields: command, Claude's interpretation, outcome/status, user feedback.

### Modify `CLAUDE.md`

Append a "Maintaining progress.md" section at the bottom instructing future agents to add an entry after every completed task, using this format:

```
---
**Task N — <short title>** (YYYY-MM-DD)
- **Command**: _exact or paraphrased user request_
- **Interpretation**: _what Claude understood and did_
- **Outcome**: completed / partial / abandoned
- **User feedback**: _corrections, praise, redirections_
```

---

## Implementation Steps

1. **Create `progress.md`** at `/Users/vegard/code/scienta/scienta_fagsem_claude_snake/progress.md` — 4 task entries
2. **Edit `CLAUDE.md`** at `/Users/vegard/code/scienta/scienta_fagsem_claude_snake/CLAUDE.md` — append the maintenance section

---

## Acceptance Criteria

- `progress.md` exists and has entries for all 4 tasks
- Each entry captures: the command given, Claude's interpretation, status, and a feedback field
- `CLAUDE.md` includes the "Maintaining progress.md" section with the update format
- No other files are modified
