# Phase 3 — Apply these files

Copy into the Bug-Lab repo:

```
frontend/src/engine/fixing.ts        ← new
frontend/src/engine/fixing.test.ts   ← new
frontend/src/components/FixPanel.tsx  ← new
frontend/src/App.tsx                  ← replaced (integrates FixPanel)
```

Then from repo root:

```
npm run install:all
npm test
npm run dev:web
```

## What Phase 3 adds

1. **Fix options** — after the student locates the bug, `FixPanel` unlocks with 4 concrete corrections.
2. **Re-run verification** — `evaluateFix` calls `runTrace` with the chosen variant. Success requires:
   - no failure in the new trace
   - correct result for the challenge input
   - variant matches `challenge.fixed` (so a lucky wrong combo is rejected)
3. **Before / after** — side-by-side step count, result, and failure kind from the buggy vs fixed traces.

Learning loop is now: Observe → Predict → Investigate → Flag → **Fix → Verify**.
