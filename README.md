# Bug Lab

> Don't just write code. Break it. Trace it. Fix it. Understand it.

An interactive debugging playground for computer science students. Instead of watching a correct algorithm
animate, students investigate a **deliberately broken binary search**: they step through it line by line, watch
the source code, variables and array update together, predict what happens next, and flag the line that is wrong.

```
bug-lab/
  frontend/   React + TypeScript + Vite + Tailwind  (the whole learning experience)
  backend/    Node + Express + TypeScript           (optional AI tutor API)
  package.json  root scripts that run both
```

The frontend works completely on its own. The backend is optional and only adds the AI tutor endpoint.

## Run it locally

```bash
npm run install:all     # installs root, frontend and backend
npm run dev             # starts both: web on :5173, api on :4000
```

Open http://localhost:5173.

Run just one side:

```bash
npm run dev:web         # frontend only (enough for the full demo)
npm run dev:api         # backend only
```

Tests and builds:

```bash
npm test                # frontend + backend tests
npm run build
```

### Optional: enable the AI tutor endpoint

```bash
cp backend/.env.example backend/.env
# put your key in backend/.env as ANTHROPIC_API_KEY=...
```

Without a key the API still starts and `POST /api/tutor` answers `503 ai-disabled`. The key never leaves the backend.

## What works so far

**Phase 1: debugger**
- Two challenges: The Infinite Loop and The Missing Element
- Synchronized debugger: active source line, `low` / `mid` / `high`, array window and explanation all come from one snapshot
- Previous / Next / Run / Pause / Reset, speed control, scrubber, keyboard shortcuts (← → Space R)
- Trace table, failure detection from the trace (repeated window, wrong result, step limit), progressive hints

**Phase 2: learning loop**
- **Predict mode**: before key lines run (loop condition, which boundary moves, new value of `low`/`high`) the student answers a question. Questions never show the code of the line being predicted, so students must read the source. Wrong answers are explained from the real state, and a question can be skipped. Next, Run and the scrubber are locked until each question is answered.
- **Something's wrong**: click the line you suspect, flag it at the step where you can see the problem. The verdict comes from the engine's own failure record: found, found early, too early, or wrong line (with a focusing hint after the first miss).
- Solved challenges get a tick in the sidebar and the bug line is revealed with an explanation.

**Phase 3: fix + verify**
- After locating the bug, choose a concrete fix; the engine re-runs the algorithm and accepts only a real passing trace.
- Before/after comparison of steps, result, and failure.

**Phase 4: Break It + tutor**
- Break It mode: edit array/target, presets (sorted found / sorted missing / unsorted).
- Third challenge: *Break the Assumptions* (correct code on unsorted input).
- Optional AI tutor (`POST /api/tutor`); core experience works offline.

**Phase 5: Smart Test Cases**
- Built-in suite (normal, boundary, edge, missing, duplicates, invalid-input).
- Deterministic runner reuses `runTrace`; pass/fail never comes from AI.
- Results dashboard, progressive failure hints, **Debug this failure** loads the case into the debugger.
- Custom tests with validation.

**Backend**
- `GET /api/health`, `POST /api/tutor` (validated with zod, size-limited, CORS locked to the frontend origin)

## How it works

No user code is ever evaluated. `frontend/src/engine/binarySearch.ts` simulates binary search one source line
at a time and records an immutable snapshot per line:

```
runTrace(array, target, variant) -> { states[], result, failure }
```

The UI only renders `states[stepIndex]`, so stepping back and forward is always consistent. Predictions
(`predict.ts`) and flag verdicts (`flagging.ts`) are pure functions over that trace, and the tests check them
against the real execution.

## Roadmap

| Phase | Scope |
|-------|-------|
| 1 | Setup, execution engine, synchronized debugger (done) |
| 2 | Predict mode, flag the bug, repo split into frontend/backend (done) |
| 3 | Fix options with re-run verification, before/after trace comparison (done) |
| 4 | Break It mode, assumptions challenge, AI tutor button, polish, demo script (done) |
| 5 | Smart Test Cases suite, dashboard, Debug this failure, custom tests (done) |
