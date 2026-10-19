# Bug Lab implementation plan

## Product approach

Bug Lab is a focused single-page learning workspace for debugging binary search. The experience is intentionally staged: learners observe a broken trace, predict the next state, investigate suspicious logic with hints, apply a fix, and verify it against the expected result. All runtime state is local and deterministic so stepping backward and forward is reliable.

## Technical approach

- React + TypeScript + Vite with Tailwind CSS and Lucide React icons.
- `src/engine/binarySearchEngine.ts` owns challenge definitions, safe step simulation, snapshots, prediction prompts, and verification. It never evaluates user code.
- `src/App.tsx` owns session state and composes the learning workspace from focused UI sections.
- `src/index.css` owns the dark developer-tool visual system, code token colors, panel treatments, and motion.
- `public/manus-routes.json` declares the single `/` route for preview and publishing tooling.

## Design direction

### Options considered

- **Night-shift IDE:** 0.06 — dense, utilitarian panels with terminal-like labels.
- **Signal Observatory:** 0.04 — a calm control room where state changes read as signals.
- **Neon Lab Notebook:** 0.08 — expressive purple-blue instrumentation layered over a workbench.

### Chosen style: Signal Observatory

**Design movement:** signal observability dashboards and high-end developer tooling.

**Core principles:** make state legible before making it decorative; use a strong vertical rhythm; distinguish diagnosis from action; keep one vivid accent for the active learning moment.

**Color philosophy:** deep ink and blue-black surfaces reduce glare, violet marks the learning system, electric cyan marks active runtime state, amber marks uncertainty, and mint confirms a repaired path.

**Layout paradigm:** a left curriculum rail anchors intent, the center trace is the main workbench, and the right visualization acts like an instrument panel. The bottom command strip is always reachable rather than hidden behind tabs.

**Signature elements:** a purple diagnostic rail, compact monospaced metadata labels, and state chips that glow only when their values change.

**Interaction philosophy:** every control answers “what changes next?” Run is never a black box; it advances the same snapshots as Next Step. Predictions pause the engine and create a small, explicit decision point.

**Animation:** use short 160–220ms ease-out transitions for active lines, pointer moves, and panel state changes. Avoid continuous motion except a subtle pulse on the running indicator.

**Typography system:** Inter for interface text and JetBrains Mono for code, labels, and numeric state. Headlines are compact and semibold; supporting copy is quiet and high contrast.

**Brand essence:** Bug Lab is a hands-on debugging studio for students who learn by making the algorithm explain itself — curious, precise, encouraging.

**Brand voice:** direct and coaching. Example lines: “The loop is alive. What should move next?” and “Good fix — the search interval shrinks now.”

**Wordmark & logo:** a small bracketed bug glyph paired with a split-dot wordmark, suggesting a breakpoint and a living system.

**Signature brand color:** `#a78bfa`, the violet diagnostic signal.

## Project structure

- `src/engine/binarySearchEngine.ts`: pure simulation and challenge model.
- `src/App.tsx`: application state and layout composition.
- `src/index.css`: Tailwind layers and custom visual styling.
- `public/manus-routes.json`: route manifest.
