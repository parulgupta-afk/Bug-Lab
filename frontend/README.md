# Bug Lab frontend

React + TypeScript + Vite + Tailwind. See the root README for what it does.

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

`src/engine` holds the simulator, challenges, predictions and flag logic (pure TypeScript, fully tested).
`src/components` holds the UI panels. `src/App.tsx` wires them together.
