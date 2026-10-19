# Bug Lab

> Don't just write code. Break it. Trace it. Fix it. Understand it.

Bug Lab is an interactive debugging playground for computer science students. Instead of watching a correct
algorithm animate, students investigate a **deliberately broken binary search**: they step through it line by
line, watch the source code, variables and array update together, and work out why it fails.

## Run it locally

```bash
npm install
npm run dev        # open the URL it prints (usually http://localhost:5173)
```

Other commands:

```bash
npm test           # engine unit tests + UI smoke test
npm run build      # type-check and production build
```

## What works in Phase 1

- Two challenges: **The Infinite Loop** and **The Missing Element**
- Synchronized debugger: active source line, `low` / `mid` / `high`, array window and explanation all come from the same snapshot
- Next / Previous / Run / Pause / Reset, speed control, a scrubber, and keyboard shortcuts (← → Space R)
- Trace table of everything executed so far (click a row to jump back)
- Automatic failure detection from the trace (repeated search window, wrong result, step limit), never from guesses
- Progressive hints
- No login, no backend, no database

## How it works

The code never runs user JavaScript (no `eval`). `src/engine/binarySearch.ts` simulates binary search one
source line at a time and records an immutable snapshot after each line:

```
runTrace(array, target, variant) -> { states[], result, failure }
```

The UI only renders `states[stepIndex]`, so Previous, Next, Reset and replay are always consistent. Loops are
caught by remembering every `(low, high)` window seen at the loop check; a repeat means no progress.

```
src/
  engine/        binarySearch.ts (simulator), challenges.ts (config), tests
  components/    CodePanel, ArrayView, VariableInspector, Controls, TraceTable, FeedbackPanel, ...
  App.tsx        layout and playback state
```

## Roadmap

| Phase | Scope |
|-------|-------|
| 1 | Project setup, execution engine, synchronized debugger (done) |
| 2 | Predict the next step, "Something's wrong" flagging on a step or source line |
| 3 | Fix options with re-run verification, before/after trace comparison |
| 4 | Break It mode (edit array and target, unsorted-array challenge), polish, demo script |
